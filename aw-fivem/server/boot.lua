-- ═══════════════════════════════════════════════════════════
-- Boot Sequence — Initializes all core systems in order
-- ═══════════════════════════════════════════════════════════

CreateThread(function()
    Wait(100)

    Core._startTime = GetGameTimer()

    print('^3====================================^0')
    print('^3  AW Framework v' .. AW.VERSION .. '^0')
    print('^3====================================^0')

    -- Initialize systems in dependency order
    local systems = {
        { name = 'Logger',      init = Core.Log._init },
        { name = 'Error',       init = Core.Error._init },
        { name = 'Config',      init = Core.Config._init },
        { name = 'Database',    init = Core.DB._init },
        { name = 'Cache',       init = Core.Cache._init },
        { name = 'Scheduler',   init = Core.Timer._init },
        { name = 'Events',      init = Core.Events._init },
        { name = 'State',       init = Core.State._init },
        { name = 'Security',    init = Core.Security._init },
        { name = 'Network',     init = Core.Net._init },
        { name = 'Callbacks',   init = Core.Callback._init },
        { name = 'Player',      init = Core.Player._init },
        { name = 'Permissions', init = Core.Permission._init },
        { name = 'Commands',    init = Core.Command._init },
        { name = 'Entity',      init = Core.Entity._init },
        { name = 'Modules',     init = Core.Modules._init },
        { name = 'Metrics',     init = Core.Metrics._init },
    }

    local failed = 0
    for _, sys in ipairs(systems) do
        local ok, err = pcall(sys.init)
        if ok then
            Core._systems[#Core._systems + 1] = sys.name
        else
            failed = failed + 1
            print(string.format('^1[FATAL] Failed to init %s: %s^0', sys.name, tostring(err)))
        end
    end

    Core._ready = true
    Core.Log.Info('core', 'Boot complete — %d/%d systems loaded', #Core._systems, #systems)

    if failed > 0 then
        Core.Log.Warn('core', '%d system(s) failed to initialize', failed)
    end

    Core.Events.Emit(AW.EVENT.CORE_READY)
    TriggerEvent(AW.EVENT.CORE_READY)

    -- Core lifecycle API
    Core.Start = function()
        Core.Log.Info('core', 'Core.Start() — already running')
    end

    Core.Stop = function()
        Core.Log.Info('core', 'Core.Stop() — shutting down')
        for name in pairs(Core.Modules.GetAll()) do
            Core.Modules.Stop(name)
        end
        Core._ready = false
    end

    Core.Reload = function()
        Core.Log.Info('core', 'Core.Reload() — reloading modules')
        for name in pairs(Core.Modules.GetAll()) do
            Core.Modules.Stop(name)
        end
        Wait(100)
        for name in pairs(Core.Modules.GetAll()) do
            Core.Modules.Start(name)
        end
    end
end)

-- ═══════════════════════════════════════════════════════════
-- Exports (external resources access via exports['aw-fivem'])
-- ═══════════════════════════════════════════════════════════

-- Lifecycle
exports('IsReady',  function() return Core.IsReady() end)
exports('GetCore',  function() return Core end)

-- Player
exports('GetPlayer',     function(src) return Core.Player.Get(src) end)
exports('GetAllPlayers', function() return Core.Player.GetAll() end)
exports('PlayerExists',  function(src) return Core.Player.Exists(src) end)
exports('GetIdentifier', function(src, t) return Core.Player.GetIdentifier(src, t) end)

-- Permissions
exports('HasPermission',    function(src, node) return Core.Permission.Has(src, node) end)
exports('AddPermission',    function(src, node) return Core.Permission.Add(src, node) end)
exports('RemovePermission', function(src, node) return Core.Permission.Remove(src, node) end)
exports('SetRank',          function(src, rank) return Core.Permission.SetRank(src, rank) end)
exports('GetRank',          function(src) return Core.Permission.GetRank(src) end)

-- Modules
exports('RegisterModule', function(name, opts) return Core.Modules.Register(name, opts) end)
exports('StartModule',    function(name) return Core.Modules.Start(name) end)
exports('StopModule',     function(name) return Core.Modules.Stop(name) end)
exports('GetModule',      function(name) return Core.Modules.Get(name) end)
exports('IsModuleReady',  function(name) return Core.Modules.IsReady(name) end)

-- Commands
exports('RegisterCommand', function(n, d, p, cb) return Core.Command.Register(n, d, p, cb) end)

-- Callbacks
exports('RegisterCallback', function(name, handler) return Core.Callback.Register(name, handler) end)

-- Events
exports('EmitEvent', function(event, ...) return Core.Events.Emit(event, ...) end)
exports('OnEvent',   function(event, fn) return Core.Events.On(event, fn) end)

-- Config
exports('GetConfig', function(key, default) return Core.Config.Get(key, default) end)
exports('SetConfig', function(key, value) return Core.Config.Set(key, value) end)

-- State
exports('GetState', function(key) return Core.State.Get(key) end)
exports('SetState', function(key, value) return Core.State.Set(key, value) end)

-- Database
exports('DBQuery',  function(q, p) return Core.DB.Query(q, p) end)
exports('DBInsert', function(q, p) return Core.DB.Insert(q, p) end)
exports('DBUpdate', function(q, p) return Core.DB.Update(q, p) end)
exports('DBDelete', function(q, p) return Core.DB.Delete(q, p) end)

-- Cache
exports('CacheGet',    function(key) return Core.Cache.Get(key) end)
exports('CacheSet',    function(key, val, ttl) return Core.Cache.Set(key, val, ttl) end)
exports('CacheRemove', function(key) return Core.Cache.Remove(key) end)

-- Entity
exports('RegisterEntity', function(e, t, d) return Core.Entity.Register(e, t, d) end)
exports('GetEntity',      function(id) return Core.Entity.Get(id) end)
exports('RemoveEntity',   function(id) return Core.Entity.Remove(id) end)

-- Logging
exports('LogInfo',  function(tag, msg, ...) return Core.Log.Info(tag, msg, ...) end)
exports('LogWarn',  function(tag, msg, ...) return Core.Log.Warn(tag, msg, ...) end)
exports('LogError', function(tag, msg, ...) return Core.Log.Error(tag, msg, ...) end)
exports('LogDebug', function(tag, msg, ...) return Core.Log.Debug(tag, msg, ...) end)

-- Metrics
exports('GetMetrics', function(key) return Core.Metrics.Get(key) end)

-- Timer
exports('SetTimeout',  function(d, cb, l) return Core.Timer.SetTimeout(d, cb, l) end)
exports('SetInterval', function(i, cb, l) return Core.Timer.SetInterval(i, cb, l) end)
exports('ClearTimer',  function(id) return Core.Timer.Clear(id) end)

-- Net
exports('NetRegister',  function(e, h) return Core.Net.Register(e, h) end)
exports('NetEmit',      function(e, t, ...) return Core.Net.Emit(e, t, ...) end)
exports('NetBroadcast', function(e, ...) return Core.Net.Broadcast(e, ...) end)

-- Resource cleanup
AddEventHandler('onResourceStop', function(name)
    if name ~= GetCurrentResourceName() then return end
    if Core and Core.Stop then Core.Stop() end
end)
