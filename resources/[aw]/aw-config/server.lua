--[[
    aw-config — Server-Side Config Loader
    Loads all data files, validates against schemas, registers into CoreRegistry.
    Freezes config after registration for immutability.
]]

local ConfigLoader = {}
ConfigLoader.__index = ConfigLoader

local frozen = false
local serverConfig = {}
local loadStartTime = 0

-- ============================================================
-- DATA TABLES (populated by data/*.lua files at load time)
-- ============================================================
AWConfigData = AWConfigData or {}

-- ============================================================
-- INTERNAL: Register a domain's data into CoreRegistry
-- ============================================================
local function RegisterDomain(domain, entries, schemaName)
    if not entries or not next(entries) then
        CoreLogger.Warn('config', 'No entries for domain: %s', domain)
        return 0, 0
    end

    -- Set domain schema if available
    if schemaName and AWConfigSchemas[schemaName] then
        CoreRegistry.SetSchema(domain, AWConfigSchemas[schemaName])
    end

    return CoreRegistry.RegisterBatch(domain, entries)
end

-- ============================================================
-- LOAD SEQUENCE
-- ============================================================
function ConfigLoader.Load()
    loadStartTime = Utils.GetTimeMs()
    CoreLogger.Info('config', '=== AIRWAR Config Loader Starting ===')

    -- Step 1: Register schemas with CoreValidator
    ConfigLoader.RegisterSchemas()

    -- Step 2: Load server settings
    ConfigLoader.LoadServerSettings()

    -- Step 3: Register all data domains into CoreRegistry
    local totalOk, totalFail = 0, 0

    local domains = {
        { domain = 'aircraft',       data = AWConfigData.aircraft,       schema = 'aircraft' },
        { domain = 'weapon',         data = AWConfigData.weapons,        schema = 'weapon' },
        { domain = 'faction',        data = AWConfigData.factions,       schema = 'faction' },
        { domain = 'zone',           data = AWConfigData.zones,          schema = 'zone' },
        { domain = 'base',           data = AWConfigData.bases,          schema = 'base' },
        { domain = 'mission',        data = AWConfigData.missions,       schema = 'mission' },
        { domain = 'rank',           data = AWConfigData.ranks,          schema = 'rank' },
        { domain = 'cm',             data = AWConfigData.countermeasures, schema = 'countermeasure' },
        { domain = 'loadout',        data = AWConfigData.loadouts,       schema = nil },
        { domain = 'achievement',    data = AWConfigData.achievements,   schema = nil },
    }

    for _, entry in ipairs(domains) do
        if entry.data then
            local ok, fail = RegisterDomain(entry.domain, entry.data, entry.schema)
            totalOk = totalOk + ok
            totalFail = totalFail + fail
            CoreLogger.Info('config', '  %-12s: %d registered, %d failed', entry.domain, ok, fail)
        end
    end

    -- Step 4: Apply economy config (not a registry domain)
    if AWConfigData.economy then
        CoreState.Set('config', 'economy', AWConfigData.economy)
    end

    -- Step 5: Apply permission defaults
    if AWConfigData.permissions then
        ConfigLoader.ApplyPermissions()
    end

    -- Step 6: Freeze
    frozen = true

    local elapsed = Utils.GetTimeMs() - loadStartTime
    CoreLogger.Info('config', '=== Config Loaded: %d types registered, %d failed (%dms) ===', totalOk, totalFail, elapsed)

    -- Emit config ready event
    CoreEvents.Emit(AW.EVENT.MODULE_READY, { module = 'config', types = totalOk })
end

-- ============================================================
-- SCHEMA REGISTRATION
-- ============================================================
function ConfigLoader.RegisterSchemas()
    for name, schema in pairs(AWConfigSchemas) do
        CoreValidator.RegisterSchema('config_' .. name, schema)
    end
    CoreLogger.Debug('config', 'Config schemas registered with CoreValidator')
end

-- ============================================================
-- SERVER SETTINGS
-- ============================================================
function ConfigLoader.LoadServerSettings()
    if not AWConfigData.server then
        CoreLogger.Warn('config', 'No server settings found, using defaults')
        return
    end

    serverConfig = Utils.DeepCopy(AWConfigData.server)

    -- Push critical settings to state for other modules
    for key, value in pairs(serverConfig) do
        CoreState.Set('config', 'server.' .. key, value)
    end

    CoreLogger.Info('config', 'Server settings loaded (%d keys)', Utils.TableCount(serverConfig))
end

-- ============================================================
-- PERMISSION DEFAULTS
-- ============================================================
function ConfigLoader.ApplyPermissions()
    local perms = AWConfigData.permissions
    if not perms then return end

    -- Register default role permissions
    if perms.role_defaults then
        for role, nodes in pairs(perms.role_defaults) do
            for _, node in ipairs(nodes) do
                -- CorePermissions will pick these up during boot
                CoreState.Set('config', 'perm_default.' .. role .. '.' .. node, true)
            end
        end
        CoreLogger.Info('config', 'Permission defaults applied for %d roles', Utils.TableCount(perms.role_defaults))
    end
end

-- ============================================================
-- PUBLIC API (Exports)
-- ============================================================

--- Get the full server config or a specific domain's config
---@param domain string|nil
---@return table
function ConfigLoader.GetConfig(domain)
    if domain then
        return CoreRegistry.GetAll(domain)
    end
    return {
        server = serverConfig,
        registry = CoreRegistry.GetStats(),
    }
end

--- Get a specific config value
---@param path string Dot-separated path e.g. "server.tick_rate" or "economy.kill_reward"
---@return any
function ConfigLoader.GetConfigValue(path)
    local parts = Utils.Split(path, '.')
    if #parts < 2 then return nil end

    local section = parts[1]
    if section == 'server' then
        local key = table.concat(parts, '.', 2)
        return serverConfig[key] or CoreState.Get('config', 'server.' .. key)
    elseif section == 'economy' then
        local eco = AWConfigData.economy
        if not eco then return nil end
        local current = eco
        for i = 2, #parts do
            if type(current) == 'table' then
                current = current[parts[i]]
            else
                return nil
            end
        end
        return current
    end

    return nil
end

--- Reload config (admin only — re-reads data tables and re-registers)
---@return boolean success
---@return string|nil error
function ConfigLoader.ReloadConfig()
    if not frozen then
        return false, 'Config not yet loaded'
    end

    CoreLogger.Warn('config', 'Config reload requested — re-registering all domains')
    frozen = false
    ConfigLoader.Load()
    return true, nil
end

-- ============================================================
-- EXPORTS
-- ============================================================
exports('GetConfig', ConfigLoader.GetConfig)
exports('GetConfigValue', ConfigLoader.GetConfigValue)
exports('ReloadConfig', ConfigLoader.ReloadConfig)

-- ============================================================
-- BOOT
-- ============================================================
CreateThread(function()
    -- Wait for aw-core to be fully ready
    while not CoreRegistry do Wait(100) end
    while not CoreLogger do Wait(100) end
    while not CoreValidator do Wait(100) end
    while not CoreState do Wait(100) end
    while not CoreEvents do Wait(100) end

    ConfigLoader.Load()
end)

AWConfigLoader = ConfigLoader
