-- ═══════════════════════════════════════════════════════════
-- System 16: Module System
-- External modules register, lifecycle: init → load → start → ready → stop
-- ═══════════════════════════════════════════════════════════

Core.Modules = {}

local _modules = {} -- { [name] = moduleData }
local STATES = { registered = 0, loaded = 1, started = 2, ready = 3, stopped = 4 }

function Core.Modules.Register(name, opts)
    opts = opts or {}
    _modules[name] = {
        name         = name,
        version      = opts.version or '1.0.0',
        description  = opts.description or '',
        dependencies = opts.dependencies or {},
        state        = STATES.registered,
        onLoad       = opts.onLoad,
        onStart      = opts.onStart,
        onReady      = opts.onReady,
        onStop       = opts.onStop,
        exports      = opts.exports or {},
    }
    Core.Log.Debug('modules', 'Registered: %s v%s', name, _modules[name].version)
    return true
end

function Core.Modules.Load(name)
    local mod = _modules[name]
    if not mod then return false, 'Module not found' end
    if mod.state >= STATES.loaded then return true end

    -- Check dependencies
    for _, dep in ipairs(mod.dependencies) do
        if not _modules[dep] or _modules[dep].state < STATES.loaded then
            return false, 'Missing dependency: ' .. dep
        end
    end

    if mod.onLoad then
        local ok, err = Core.Error.Try(mod.onLoad)
        if not ok then return false, err end
    end

    mod.state = STATES.loaded
    Core.Log.Debug('modules', 'Loaded: %s', name)
    return true
end

function Core.Modules.Start(name)
    local mod = _modules[name]
    if not mod then return false end
    if mod.state < STATES.loaded then Core.Modules.Load(name) end

    if mod.onStart then Core.Error.Try(mod.onStart) end
    mod.state = STATES.started

    if mod.onReady then Core.Error.Try(mod.onReady) end
    mod.state = STATES.ready

    Core.Log.Info('modules', 'Started: %s', name)
    return true
end

function Core.Modules.Stop(name)
    local mod = _modules[name]
    if not mod then return false end
    if mod.onStop then Core.Error.Try(mod.onStop) end
    mod.state = STATES.stopped
    Core.Log.Info('modules', 'Stopped: %s', name)
    return true
end

function Core.Modules.Get(name)
    return _modules[name]
end

function Core.Modules.GetAll()
    return _modules
end

function Core.Modules.IsReady(name)
    local mod = _modules[name]
    return mod and mod.state >= STATES.ready
end

function Core.Modules._init()
    Core.Log.Info('core', 'Module system initialized')
end
