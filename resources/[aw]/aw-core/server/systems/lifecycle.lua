--[[
    System 10: Lifecycle
    Boot sequence orchestration, health monitoring, graceful shutdown.
    This is the master controller — wires all 15 systems together.
]]

local Lifecycle = {}
Lifecycle.__index = Lifecycle

local bootStart = 0
local bootComplete = false
local shutdownInProgress = false
local systemStatus = {} -- { [systemName] = 'ok' | 'error' }

-- ============================================================
-- BOOT SEQUENCE
-- ============================================================

function Lifecycle.Init()
    CoreLogger.Info('lifecycle', 'Lifecycle controller initializing...')
end

--- Execute the full boot sequence — called from boot.lua
---@return boolean success
function Lifecycle.Boot()
    bootStart = GetGameTimer()

    print('^2============================================================^0')
    print('^2   AIRWAR Framework v' .. AW.VERSION.STRING .. ' — Booting...^0')
    print('^2============================================================^0')

    -- Phase 1: Infrastructure systems (no dependencies on other Core systems)
    local phase1 = {
        { name = 'Logger',     init = CoreLogger.Init },
        { name = 'Validator',  init = CoreValidator.Init },
        { name = 'Scheduler',  init = CoreScheduler.Init },
        { name = 'Middleware',  init = CoreMiddleware.Init },
    }

    -- Phase 2: Data & state systems
    local phase2 = {
        { name = 'Database',   init = CoreDatabase.Init },
        { name = 'Cache',      init = CoreCache.Init },
        { name = 'State',      init = CoreState.Init },
    }

    -- Phase 3: Identity & communication systems
    local phase3 = {
        { name = 'Events',     init = CoreEvents.Init },
        { name = 'Identity',   init = CoreIdentity.Init },
        { name = 'Callbacks',  init = CoreCallbacks.Init },
        { name = 'Permissions', init = CorePermissions.Init },
    }

    -- Phase 4: Framework layer systems
    local phase4 = {
        { name = 'Registry',   init = CoreRegistry.Init },
        { name = 'Commands',   init = CoreCommands.Init },
        { name = 'API',        init = CoreAPI.Init },
    }

    local phases = { phase1, phase2, phase3, phase4 }
    local phaseNames = { 'Infrastructure', 'Data & State', 'Identity & Communication', 'Framework' }

    for phaseIndex, phase in ipairs(phases) do
        CoreLogger.Info('lifecycle', '  Phase %d: %s', phaseIndex, phaseNames[phaseIndex])
        for _, sys in ipairs(phase) do
            local ok, err = pcall(sys.init)
            if ok then
                systemStatus[sys.name] = 'ok'
                CoreLogger.Info('lifecycle', '    [OK] %s', sys.name)
            else
                systemStatus[sys.name] = 'error'
                CoreLogger.Error('lifecycle', '    [FAIL] %s: %s', sys.name, tostring(err))

                -- Critical systems cannot fail
                local critical = { Logger = true, Database = true, Identity = true, Events = true }
                if critical[sys.name] then
                    print(string.format('^1[AIRWAR] CRITICAL: System "%s" failed to init. Server CANNOT operate.^0', sys.name))
                    print(string.format('^1[AIRWAR] Error: %s^0', tostring(err)))
                    return false
                end
            end
        end
    end

    -- Phase 5: Register built-in commands
    Lifecycle._RegisterCoreCommands()

    -- Phase 6: Schedule periodic tasks
    Lifecycle._SchedulePeriodicTasks()

    -- Done
    local elapsed = GetGameTimer() - bootStart
    bootComplete = true

    print('^2============================================================^0')
    print(string.format('^2   AIRWAR Framework v%s — Boot complete (%dms)^0', AW.VERSION.STRING, elapsed))
    print(string.format('^2   Systems: %d OK, %d FAILED^0', Lifecycle._CountStatus('ok'), Lifecycle._CountStatus('error')))
    print('^2============================================================^0')

    CoreEvents.Emit(AW.EVENT.CORE_READY, { bootTime = elapsed })

    return true
end

-- ============================================================
-- GRACEFUL SHUTDOWN
-- ============================================================

--- Trigger graceful shutdown — flush all data, notify modules
function Lifecycle.Shutdown(reason)
    if shutdownInProgress then return end
    shutdownInProgress = true

    CoreLogger.Warn('lifecycle', 'Shutdown initiated: %s', reason or 'manual')
    CoreEvents.Emit(AW.EVENT.CORE_SHUTDOWN, { reason = reason })

    -- Flush all player data
    local players = CoreIdentity.GetAll()
    CoreLogger.Info('lifecycle', 'Flushing data for %d players...', Utils.TableCount(players))
    for awid, _ in pairs(players) do
        pcall(CoreDatabase.FlushPlayer, awid)
    end

    -- Flush write-behind queue
    pcall(CoreDatabase.FlushWriteBehind)

    -- Flush log buffer
    pcall(CoreLogger.FlushToDb)

    CoreLogger.Info('lifecycle', 'Shutdown complete.')
end

-- ============================================================
-- HEALTH MONITORING
-- ============================================================

--- Get overall system health
---@return table
function Lifecycle.GetHealth()
    return {
        booted    = bootComplete,
        uptime    = bootComplete and (GetGameTimer() - bootStart) or 0,
        systems   = systemStatus,
        modules   = CoreAPI.GetAllModuleStatus(),
        players   = CoreIdentity.GetCount(),
        cacheStats = CoreCache.GetStats(),
        shutdown  = shutdownInProgress,
    }
end

--- Check if the framework is fully operational
---@return boolean
function Lifecycle.IsReady()
    return bootComplete and not shutdownInProgress
end

-- ============================================================
-- PERIODIC TASKS
-- ============================================================

function Lifecycle._SchedulePeriodicTasks()
    -- Database write-behind flush (every 30s)
    CoreScheduler.Repeat('core:db_flush', math.floor(1000 / AW.TICK.DB_FLUSH), function()
        CoreDatabase.FlushWriteBehind()
    end)

    -- Log buffer flush (every 10s)
    CoreScheduler.Repeat('core:log_flush', math.floor(1000 / AW.TICK.LOG_FLUSH), function()
        CoreLogger.FlushToDb()
    end)

    -- Cache purge expired (every 60s)
    CoreScheduler.Repeat('core:cache_purge', 60000, function()
        CoreCache.PurgeExpired()
    end)

    -- Module health checks (every 5s)
    CoreScheduler.Repeat('core:health_check', math.floor(1000 / AW.TICK.HEALTH_CHECK), function()
        CoreAPI.RunHealthChecks()
    end)

    CoreLogger.Info('lifecycle', 'Periodic tasks scheduled')
end

-- ============================================================
-- BUILT-IN COMMANDS
-- ============================================================

function Lifecycle._RegisterCoreCommands()
    -- /awstatus — Show server status
    CoreCommands.Register('awstatus', {
        description = 'Show AIRWAR server status',
        permission  = AW.PERM.ADMIN_DEBUG,
        handler = function(player, _)
            local health = Lifecycle.GetHealth()
            local msg = string.format(
                '%sUptime: %ds | Players: %d | Systems: %d OK | Modules: %d',
                AW.CHAT_PREFIX,
                math.floor(health.uptime / 1000),
                health.players,
                Lifecycle._CountStatus('ok'),
                Utils.TableCount(health.modules)
            )
            if player then
                TriggerClientEvent('chat:addMessage', player.serverId, { args = { msg } })
            else
                print(msg)
            end
        end,
    })

    -- /awplayers — List online players
    CoreCommands.Register('awplayers', {
        description = 'List online AIRWAR players',
        permission  = AW.PERM.ADMIN_MOD,
        handler = function(player, _)
            local all = CoreIdentity.GetAll()
            local lines = { AW.CHAT_PREFIX .. 'Online Players:' }
            for awid, p in pairs(all) do
                lines[#lines + 1] = string.format('  %s | %s | %s | %s', awid, p.name, p.callsign or '-', p.role)
            end
            local msg = table.concat(lines, '\n')
            if player then
                TriggerClientEvent('chat:addMessage', player.serverId, { args = { msg } })
            else
                print(msg)
            end
        end,
    })

    -- /awreload — Hot-reload a module
    CoreCommands.Register('awreload', {
        description = 'Reload a module',
        permission  = AW.PERM.ADMIN_FULL,
        args = { { name = 'module', type = 'string', required = true } },
        handler = function(player, args)
            local mod = args.module
            if CoreAPI.IsModuleAvailable(mod) then
                CoreAPI.DisableModule(mod)
                Wait(100)
                CoreAPI.EnableModule(mod)
                local msg = AW.CHAT_PREFIX .. 'Module reloaded: ' .. mod
                if player then
                    TriggerClientEvent('chat:addMessage', player.serverId, { args = { msg } })
                else
                    print(msg)
                end
            else
                local msg = AW.CHAT_PREFIX .. 'Module not found or unavailable: ' .. mod
                if player then
                    TriggerClientEvent('chat:addMessage', player.serverId, { args = { msg } })
                else
                    print(msg)
                end
            end
        end,
    })

    -- /awflush — Force flush all data to DB
    CoreCommands.Register('awflush', {
        description = 'Force flush all data to database',
        permission  = AW.PERM.ADMIN_FULL,
        handler = function(player, _)
            CoreDatabase.FlushWriteBehind()
            CoreLogger.FlushToDb()
            local msg = AW.CHAT_PREFIX .. 'Data flushed to database.'
            if player then
                TriggerClientEvent('chat:addMessage', player.serverId, { args = { msg } })
            else
                print(msg)
            end
        end,
    })

    CoreLogger.Info('lifecycle', 'Core commands registered (%d total)', CoreCommands.GetCount())
end

-- ============================================================
-- HELPERS
-- ============================================================

function Lifecycle._CountStatus(status)
    local count = 0
    for _, s in pairs(systemStatus) do
        if s == status then count = count + 1 end
    end
    return count
end

CoreLifecycle = Lifecycle
