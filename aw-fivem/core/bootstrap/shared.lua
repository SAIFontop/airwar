-- ═══════════════════════════════════════════════════════════
-- Core Global — Created first, systems attach to it
-- ═══════════════════════════════════════════════════════════

Core = {
    _version   = AW.VERSION,
    _name      = AW.NAME,
    _ready     = false,
    _startTime = 0,
    _systems   = {},
}

function Core.IsReady()
    return Core._ready
end

function Core.GetUptime()
    if Core._startTime == 0 then return 0 end
    return (GetGameTimer() - Core._startTime)
end
