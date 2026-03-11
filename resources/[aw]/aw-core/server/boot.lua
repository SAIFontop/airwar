--[[
    AIRWAR Core — Server Boot
    Entry point. Loads all core systems and initiates the boot sequence.
    This file is loaded FIRST by fxmanifest.lua's server_scripts order.
    Systems are loaded via fxmanifest.lua in dependency order.
    This file only triggers the lifecycle boot after all systems are available.
]]

-- ============================================================
-- EXPORT BRIDGE
-- These global functions back the exports declared in fxmanifest.lua
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

--- Lifecycle: Is the framework ready?
function IsReady()
    return CoreLifecycle and CoreLifecycle.IsReady() or false
end

--- Lifecycle: Get the Core API facade for external resources
function GetCoreAPI()
    return {
        GetSystem = function(name)
            local getter = SYSTEM_MAP[name]
            return getter and getter() or nil
        end,
    }
end

--- Identity: Get AWID by server ID
function GetAWID(serverId)
    if not CoreIdentity then return nil end
    local player = CoreIdentity.GetPlayerByServerId(serverId)
    return player and player.awid or nil
end

--- Module registration
function RegisterModule(moduleId, opts) return CoreAPI.RegisterModule(moduleId, opts) end
function GetModuleState(moduleId) return CoreAPI.GetModuleInfo(moduleId) end

--- Player API
function GetPlayer(awid) return CoreIdentity.GetPlayer(awid) end
function GetPlayerByServerId(serverId) return CoreIdentity.GetPlayerByServerId(serverId) end
function GetAllPlayers() return CoreIdentity.GetAllPlayers() end
function GetPlayerCount() return CoreIdentity.GetPlayerCount() end

--- State
function GetState(key) return CoreState.GetGlobal(key) end
function SetState(key, value) return CoreState.SetGlobal(key, value) end

--- Events
function EmitEvent(name, data) return CoreEvents.Emit(name, data) end
function OnEvent(name, handler) return CoreEvents.On(name, handler) end

--- Module router
function CallModule(target, export, ...) return CoreAPI.Call(target, export, ...) end

--- Registry
function RegisterType(domain, typeId, data) return CoreRegistry.Register(domain, typeId, data) end
function GetType(domain, typeId) return CoreRegistry.Get(domain, typeId) end
function GetAllTypes(domain) return CoreRegistry.GetAll(domain) end

--- Cache
function CacheGet(ns, key) return CoreCache.Get(ns, key) end
function CacheSet(ns, key, val, ttl) return CoreCache.Set(ns, key, val, ttl) end
function CacheInvalidate(ns, key) return CoreCache.Invalidate(ns, key) end

--- Permissions
function HasPermission(awid, node) return CorePermissions.HasPermission(awid, node) end
function AddPermission(awid, node) return CorePermissions.GrantPermission(awid, node) end
function RemovePermission(awid, node) return CorePermissions.RevokePermission(awid, node) end

--- Scheduler
function ScheduleOnce(delay, cb, label) return CoreScheduler.Once(delay, cb, label) end
function ScheduleRepeat(interval, cb, label) return CoreScheduler.Repeat(interval, cb, label) end
function CancelSchedule(id) return CoreScheduler.Cancel(id) end

--- Callbacks
function RegisterCallback(name, handler) return CoreCallbacks.Register(name, handler) end

--- Commands
function RegisterCommand(name, opts) return CoreCommands.Register(name, opts) end

--- Data (Database table proxy)
function DataFind(table, where) return CoreDatabase.Table(table):Find(where) end
function DataFindAll(table, where) return CoreDatabase.Table(table):FindAll(where) end
function DataInsert(table, data) return CoreDatabase.Table(table):Insert(data) end
function DataUpdate(table, where, data) return CoreDatabase.Table(table):Update(where, data) end
function DataDelete(table, where) return CoreDatabase.Table(table):Delete(where) end
function DataIncrement(table, where, col, amt) return CoreDatabase.Table(table):Increment(where, col, amt) end

--- UI
function UISetState(serverId, key, val) return CoreState.SetClient(serverId, key, val) end
function UINotify(serverId, msg) TriggerClientEvent(AW.EVENT.UI_UPDATE, serverId, { notify = msg }) end

--- Log
function LogInfo(src, msg, ...) return CoreLogger.Info(src, msg, ...) end
function LogWarn(src, msg, ...) return CoreLogger.Warn(src, msg, ...) end
function LogError(src, msg, ...) return CoreLogger.Error(src, msg, ...) end
function LogDebug(src, msg, ...) return CoreLogger.Debug(src, msg, ...) end

--- Validator
function Validate(schema, data) return CoreValidator.Validate(schema, data) end

--- HTTP
function RegisterRoute(method, path, handler) return CoreHttpRouter.Route(method, path, handler) end

--- Utility
function GenerateId(prefix, length) return Utils.GenerateId(prefix, length) end

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
