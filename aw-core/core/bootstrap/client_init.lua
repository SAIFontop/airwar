-- ═══════════════════════════════════════════════════════════
-- Client Core Global
-- ═══════════════════════════════════════════════════════════

Core = {
    _ready   = false,
    _version = AW.VERSION,
}

function Core.IsReady()
    return Core._ready
end
