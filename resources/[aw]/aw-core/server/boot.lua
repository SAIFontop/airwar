--[[
    AIRWAR Core — Server Boot
    Entry point. Loads all core systems and initiates the boot sequence.
    This file is loaded FIRST by fxmanifest.lua's server_scripts order.
    Systems are loaded via fxmanifest.lua in dependency order.
    This file only triggers the lifecycle boot after all systems are available.
]]

-- ============================================================
-- EXPORT BRIDGE
-- Uses runtime exports() registration so we don't shadow FiveM
-- natives (e.g. RegisterCommand) and lua54 scoping works correctly.
-- ============================================================

local SYSTEM_MAP = {
    Logger      = function() return CoreLogger end,
    Validator   = function() return CoreValidator end,
    Scheduler   = function() return CoreScheduler end,
    Middleware  = function() return CoreMiddleware end,
    Database    = function() return CoreDatabase end,
    Cache       = function() return CoreCache end,
    State       = function() return CoreState end,
    Events      = function() return CoreEvents end,
    Identity    = function() return CoreIdentity end,
    Callbacks   = function() return CoreCallbacks end,
    Permissions = function() return CorePermissions end,
    Registry    = function() return CoreRegistry end,
    Commands    = function() return CoreCommands end,
    API         = function() return CoreAPI end,
    Lifecycle   = function() return CoreLifecycle end,
}

-- Lifecycle
exports('IsReady', function()
    return CoreLifecycle and CoreLifecycle.IsReady() or false
end)

exports('GetCoreAPI', function()
    return {
        GetSystem = function(name)
            local getter = SYSTEM_MAP[name]
            return getter and getter() or nil
        end,
    }
end)

-- Identity
exports('GetAWID', function(serverId)
    if not CoreIdentity then return nil end
    local player = CoreIdentity.GetPlayerByServerId(serverId)
    return player and player.awid or nil
end)

-- Module registration
exports('RegisterModule', function(moduleId, opts) return CoreAPI.RegisterModule(moduleId, opts) end)
exports('GetModuleState', function(moduleId) return CoreAPI.GetModuleInfo(moduleId) end)

-- Player API
exports('GetPlayer', function(awid) return CoreIdentity.GetPlayer(awid) end)
exports('GetPlayerByServerId', function(serverId) return CoreIdentity.GetPlayerByServerId(serverId) end)
exports('GetAllPlayers', function() return CoreIdentity.GetAllPlayers() end)
exports('GetPlayerCount', function() return CoreIdentity.GetPlayerCount() end)

-- State
exports('GetState', function(key) return CoreState.GetGlobal(key) end)
exports('SetState', function(key, value) return CoreState.SetGlobal(key, value) end)

-- Events
exports('EmitEvent', function(name, data) return CoreEvents.Emit(name, data) end)
exports('OnEvent', function(name, handler) return CoreEvents.On(name, handler) end)

-- Module router
exports('CallModule', function(target, export, ...) return CoreAPI.Call(target, export, ...) end)

-- Registry
exports('RegisterType', function(domain, typeId, data) return CoreRegistry.Register(domain, typeId, data) end)
exports('GetType', function(domain, typeId) return CoreRegistry.Get(domain, typeId) end)
exports('GetAllTypes', function(domain) return CoreRegistry.GetAll(domain) end)

-- Cache
exports('CacheGet', function(ns, key) return CoreCache.Get(ns, key) end)
exports('CacheSet', function(ns, key, val, ttl) return CoreCache.Set(ns, key, val, ttl) end)
exports('CacheInvalidate', function(ns, key) return CoreCache.Invalidate(ns, key) end)

-- Permissions
exports('HasPermission', function(awid, node) return CorePermissions.HasPermission(awid, node) end)
exports('AddPermission', function(awid, node) return CorePermissions.GrantPermission(awid, node) end)
exports('RemovePermission', function(awid, node) return CorePermissions.RevokePermission(awid, node) end)

-- Scheduler
exports('ScheduleOnce', function(delay, cb, label) return CoreScheduler.Once(delay, cb, label) end)
exports('ScheduleRepeat', function(interval, cb, label) return CoreScheduler.Repeat(interval, cb, label) end)
exports('CancelSchedule', function(id) return CoreScheduler.Cancel(id) end)

-- Callbacks
exports('RegisterCallback', function(name, handler) return CoreCallbacks.Register(name, handler) end)

-- Commands (NOT RegisterCommand — that would shadow FiveM native)
exports('RegisterCommand', function(name, opts) return CoreCommands.Register(name, opts) end)

-- Data (Database table proxy)
exports('DataFind', function(tbl, where) return CoreDatabase.Table(tbl):Find(where) end)
exports('DataFindAll', function(tbl, where) return CoreDatabase.Table(tbl):FindAll(where) end)
exports('DataInsert', function(tbl, data) return CoreDatabase.Table(tbl):Insert(data) end)
exports('DataUpdate', function(tbl, where, data) return CoreDatabase.Table(tbl):Update(where, data) end)
exports('DataDelete', function(tbl, where) return CoreDatabase.Table(tbl):Delete(where) end)
exports('DataIncrement', function(tbl, where, col, amt) return CoreDatabase.Table(tbl):Increment(where, col, amt) end)

-- UI
exports('UISetState', function(serverId, key, val) return CoreState.SetClient(serverId, key, val) end)
exports('UINotify', function(serverId, msg) TriggerClientEvent(AW.EVENT.UI_UPDATE, serverId, { notify = msg }) end)

-- Log
exports('LogInfo', function(src, msg, ...) return CoreLogger.Info(src, msg, ...) end)
exports('LogWarn', function(src, msg, ...) return CoreLogger.Warn(src, msg, ...) end)
exports('LogError', function(src, msg, ...) return CoreLogger.Error(src, msg, ...) end)
exports('LogDebug', function(src, msg, ...) return CoreLogger.Debug(src, msg, ...) end)

-- Validator
exports('Validate', function(schema, data) return CoreValidator.Validate(schema, data) end)

-- HTTP
exports('RegisterRoute', function(method, path, handler) return CoreHttpRouter.Route(method, path, handler) end)

-- Utility
exports('GenerateId', function(prefix, length) return Utils.GenerateId(prefix, length) end)

-- ============================================================
-- BOOT TRIGGER
-- ============================================================

-- All system files (logger, validator, scheduler, middleware, database,
-- cache, state, events, identity, callbacks, permissions, registry,
-- commands, api, lifecycle) are loaded before this via fxmanifest.lua.
-- HTTP router, auth, and routes are also loaded.
-- Handlers (player_connect, player_drop, resource_stop) are loaded last.

-- The lifecycle system orchestrates the actual Init() calls in the correct
-- dependency order across all systems.

CreateThread(function()
    Wait(100) -- Brief delay to ensure all scripts are parsed

    -- Initialize HTTP auth (standalone, not part of lifecycle phases)
    HttpAuth.Init()

    -- Register the FiveM HTTP handler for API routes
    SetHttpHandler(function(req, res)
        CoreHttpRouter.HandleRequest(req, res)
    end)

    -- Execute the master boot sequence
    local success = CoreLifecycle.Boot()

    if not success then
        print('^1============================================================^0')
        print('^1   AIRWAR BOOT FAILED — Check errors above                  ^0')
        print('^1============================================================^0')
    end
end)
