-- ═══════════════════════════════════════════════════════════
-- System 9: Security Layer
-- Rate limiting, payload validation, event protection
-- ═══════════════════════════════════════════════════════════

Core.Security = {}

local _rateLimits = {} -- { [source] = { [event] = { count, resetAt } } }
local _config = {
    defaultRate = 30,    -- max events per window
    windowMs    = 5000,  -- 5 second window
    maxPayload  = 32768, -- 32KB max payload
}

function Core.Security.CheckRate(source, event)
    local now = GetGameTimer()
    if not _rateLimits[source] then _rateLimits[source] = {} end
    local entry = _rateLimits[source][event]

    if not entry or now > entry.resetAt then
        _rateLimits[source][event] = { count = 1, resetAt = now + _config.windowMs }
        return true
    end

    entry.count = entry.count + 1
    if entry.count > _config.defaultRate then
        Core.Log.Warn('security', 'Rate limit: source %d on %s (%d/%d)', source, event, entry.count, _config.defaultRate)
        return false
    end
    return true
end

function Core.Security.ValidatePayload(data)
    local encoded = type(data) == 'table' and json.encode(data) or tostring(data or '')
    return #encoded <= _config.maxPayload
end

function Core.Security.CleanupSource(source)
    _rateLimits[source] = nil
end

function Core.Security.Configure(opts)
    if opts.defaultRate then _config.defaultRate = opts.defaultRate end
    if opts.windowMs then _config.windowMs = opts.windowMs end
    if opts.maxPayload then _config.maxPayload = opts.maxPayload end
end

function Core.Security._init()
    Core.Log.Info('core', 'Security layer initialized')
end
