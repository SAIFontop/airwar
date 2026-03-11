-- ═══════════════════════════════════════════════════════════
-- System 17: Metrics
-- Server performance monitoring
-- ═══════════════════════════════════════════════════════════

Core.Metrics = {}

local _data = {
    playerCount = 0,
    entityCount = 0,
    tickRate    = 0,
    uptime      = 0,
}
local _lastTick    = 0
local _tickSamples = {}

function Core.Metrics.Get(key)
    return key and _data[key] or _data
end

function Core.Metrics.Set(key, value)
    _data[key] = value
end

function Core.Metrics.Increment(key, amount)
    _data[key] = (_data[key] or 0) + (amount or 1)
end

function Core.Metrics._collect()
    _data.playerCount = Core.Player.Count()
    _data.entityCount = Core.Entity.Count()
    _data.uptime      = Core.GetUptime()

    -- Tick rate
    local now = GetGameTimer()
    if _lastTick > 0 then
        _tickSamples[#_tickSamples + 1] = now - _lastTick
        if #_tickSamples > 60 then table.remove(_tickSamples, 1) end
        local total = 0
        for _, s in ipairs(_tickSamples) do total = total + s end
        local avgMs = total / #_tickSamples
        _data.tickRate = avgMs > 0 and Utils.Round(1000 / avgMs, 1) or 0
    end
    _lastTick = now
end

function Core.Metrics._init()
    Core.Timer.SetInterval(1000, Core.Metrics._collect, 'metrics_collect')
    Core.Log.Info('core', 'Metrics system initialized')
end
