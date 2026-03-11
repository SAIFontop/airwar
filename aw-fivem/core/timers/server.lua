-- ═══════════════════════════════════════════════════════════
-- System 6: Scheduler
-- Timeout / Interval timer management
-- ═══════════════════════════════════════════════════════════

Core.Timer = {}

local _timers = {}
local _nextId = 1

function Core.Timer.SetTimeout(delay, callback, label)
    local id = _nextId
    _nextId = _nextId + 1
    _timers[id] = { type = 'timeout', label = label or '' }
    CreateThread(function()
        Wait(delay)
        if _timers[id] then
            _timers[id] = nil
            Core.Error.Try(callback)
        end
    end)
    return id
end

function Core.Timer.SetInterval(interval, callback, label)
    local id = _nextId
    _nextId = _nextId + 1
    _timers[id] = { type = 'interval', label = label or '' }
    CreateThread(function()
        while _timers[id] do
            Wait(interval)
            if _timers[id] then
                Core.Error.Try(callback)
            end
        end
    end)
    return id
end

function Core.Timer.Clear(id)
    _timers[id] = nil
end

function Core.Timer.GetActive()
    return Utils.TableCount(_timers)
end

function Core.Timer._init()
    -- Cache cleanup every 60s
    Core.Timer.SetInterval(60000, function()
        Core.Cache.Cleanup()
    end, 'cache_cleanup')
    Core.Log.Info('core', 'Scheduler initialized')
end
