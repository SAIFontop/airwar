--[[
    System 8: Cache
    In-memory TTL cache with LRU eviction and write-behind support
]]

local Cache = {}
Cache.__index = Cache

local store = {}       -- { [namespace:key] = { value, expires, lastAccess, dirty } }
local MAX_ENTRIES = 5000
local DEFAULT_TTL = 300000 -- 5 minutes in ms

-- ============================================================
-- CORE API
-- ============================================================

function Cache.Init()
    CoreLogger.Info('cache', 'Cache system initialized (max_entries=%d)', MAX_ENTRIES)
end

--- Get a cached value
---@param namespace string
---@param key string
---@return any|nil
function Cache.Get(namespace, key)
    local cacheKey = namespace .. ':' .. key
    local entry = store[cacheKey]

    if not entry then return nil end

    -- Check TTL expiry
    if entry.expires and GetGameTimer() > entry.expires then
        store[cacheKey] = nil
        return nil
    end

    entry.lastAccess = GetGameTimer()
    return entry.value
end

--- Set a cached value
---@param namespace string
---@param key string
---@param value any
---@param ttl number|nil TTL in milliseconds (nil = default)
function Cache.Set(namespace, key, value, ttl)
    local cacheKey = namespace .. ':' .. key
    local now = GetGameTimer()

    -- Evict if at capacity
    if not store[cacheKey] then
        local count = 0
        for _ in pairs(store) do count = count + 1 end
        if count >= MAX_ENTRIES then
            Cache.EvictLRU()
        end
    end

    store[cacheKey] = {
        value = value,
        expires = ttl and (now + ttl) or (now + DEFAULT_TTL),
        lastAccess = now,
        dirty = false,
    }
end

--- Set with write-behind flag (will be flushed to DB)
---@param namespace string
---@param key string
---@param value any
---@param ttl number|nil
function Cache.SetDirty(namespace, key, value, ttl)
    Cache.Set(namespace, key, value, ttl)
    local cacheKey = namespace .. ':' .. key
    if store[cacheKey] then
        store[cacheKey].dirty = true
    end
end

--- Invalidate a specific key
---@param namespace string
---@param key string
function Cache.Invalidate(namespace, key)
    store[namespace .. ':' .. key] = nil
end

--- Invalidate all keys in a namespace
---@param namespace string
function Cache.InvalidateNamespace(namespace)
    local prefix = namespace .. ':'
    for k in pairs(store) do
        if k:sub(1, #prefix) == prefix then
            store[k] = nil
        end
    end
end

--- Evict the least recently used entry
function Cache.EvictLRU()
    local oldestKey = nil
    local oldestTime = math.huge

    for k, entry in pairs(store) do
        if not entry.dirty and entry.lastAccess < oldestTime then
            oldestTime = entry.lastAccess
            oldestKey = k
        end
    end

    if oldestKey then
        store[oldestKey] = nil
    end
end

--- Clear expired entries
function Cache.PurgeExpired()
    local now = GetGameTimer()
    local purged = 0
    for k, entry in pairs(store) do
        if entry.expires and now > entry.expires then
            store[k] = nil
            purged = purged + 1
        end
    end
    if purged > 0 then
        CoreLogger.Debug('cache', 'Purged %d expired entries', purged)
    end
end

--- Get all dirty entries (for write-behind flush)
---@return table
function Cache.GetDirtyEntries()
    local dirty = {}
    for k, entry in pairs(store) do
        if entry.dirty then
            dirty[k] = entry.value
            entry.dirty = false
        end
    end
    return dirty
end

--- Get cache statistics
---@return table
function Cache.GetStats()
    local count = 0
    local dirtyCount = 0
    for _, entry in pairs(store) do
        count = count + 1
        if entry.dirty then dirtyCount = dirtyCount + 1 end
    end
    return {
        entries = count,
        dirty = dirtyCount,
        max = MAX_ENTRIES,
    }
end

--- Clear entire cache
function Cache.Clear()
    store = {}
    CoreLogger.Info('cache', 'Cache cleared')
end

CoreCache = Cache
