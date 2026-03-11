-- ═══════════════════════════════════════════════════════════
-- System 5: Cache
-- In-memory key-value store with TTL support
-- ═══════════════════════════════════════════════════════════

Core.Cache = {}

local _data = {} -- { [key] = { value, expires } }

function Core.Cache.Set(key, value, ttl)
    local expires = ttl and (GetGameTimer() + ttl * 1000) or nil
    _data[key] = { value = value, expires = expires }
end

function Core.Cache.Get(key)
    local entry = _data[key]
    if not entry then return nil end
    if entry.expires and GetGameTimer() > entry.expires then
        _data[key] = nil
        return nil
    end
    return entry.value
end

function Core.Cache.Remove(key)
    _data[key] = nil
end

function Core.Cache.Clear()
    _data = {}
end

function Core.Cache.Cleanup()
    local now = GetGameTimer()
    for key, entry in pairs(_data) do
        if entry.expires and now > entry.expires then
            _data[key] = nil
        end
    end
end

function Core.Cache._init()
    Core.Log.Info('core', 'Cache system initialized')
end
