--[[
    System 5: State Manager
    Three-tier state: volatile (memory), replicated (StateBags), persistent (DB)
    Dirty tracking for write-behind
]]

local State = {}
State.__index = State

-- Volatile state (server memory only)
local volatile = {}    -- { [namespace:key] = value }

-- Replicated state tracking (StateBags)
local replicated = {}  -- { [entityId:key] = { value, lastSync } }

-- Persistent state dirty flags
local persistentDirty = {}  -- { [awid:section] = true }

-- ============================================================
-- CORE API
-- ============================================================

function State.Init()
    CoreLogger.Info('state', 'State manager initialized')
end

-- ============================================================
-- TIER 1: VOLATILE (server memory only)
-- ============================================================

--- Get volatile state
---@param namespace string
---@param key string
---@return any
function State.GetVolatile(namespace, key)
    return volatile[namespace .. ':' .. key]
end

--- Set volatile state
---@param namespace string
---@param key string
---@param value any
function State.SetVolatile(namespace, key, value)
    volatile[namespace .. ':' .. key] = value
end

--- Get all volatile state for a namespace
---@param namespace string
---@return table
function State.GetVolatileNamespace(namespace)
    local result = {}
    local prefix = namespace .. ':'
    for k, v in pairs(volatile) do
        if k:sub(1, #prefix) == prefix then
            result[k:sub(#prefix + 1)] = v
        end
    end
    return result
end

--- Remove volatile state
---@param namespace string
---@param key string|nil If nil, removes entire namespace
function State.RemoveVolatile(namespace, key)
    if key then
        volatile[namespace .. ':' .. key] = nil
    else
        local prefix = namespace .. ':'
        for k in pairs(volatile) do
            if k:sub(1, #prefix) == prefix then
                volatile[k] = nil
            end
        end
    end
end

-- ============================================================
-- TIER 2: REPLICATED (StateBags via OneSync)
-- ============================================================

--- Set replicated state on an entity
---@param entity number Entity handle
---@param key string
---@param value any
function State.SetReplicated(entity, key, value)
    local bagKey = AW.STATEBAG_PREFIX .. key
    Entity(entity).state:set(bagKey, value, true)

    local trackKey = tostring(entity) .. ':' .. key
    replicated[trackKey] = { value = value, lastSync = GetGameTimer() }
end

--- Get replicated state from an entity
---@param entity number Entity handle
---@param key string
---@return any
function State.GetReplicated(entity, key)
    local bagKey = AW.STATEBAG_PREFIX .. key
    return Entity(entity).state[bagKey]
end

--- Set replicated state on a player
---@param serverId number
---@param key string
---@param value any
function State.SetPlayerReplicated(serverId, key, value)
    local bagKey = AW.STATEBAG_PREFIX .. key
    Player(serverId).state:set(bagKey, value, true)
end

--- Get replicated player state
---@param serverId number
---@param key string
---@return any
function State.GetPlayerReplicated(serverId, key)
    local bagKey = AW.STATEBAG_PREFIX .. key
    return Player(serverId).state[bagKey]
end

--- Set global replicated state (all clients see it)
---@param key string
---@param value any
function State.SetGlobal(key, value)
    local bagKey = AW.STATEBAG_PREFIX .. key
    GlobalState[bagKey] = value
end

--- Get global replicated state
---@param key string
---@return any
function State.GetGlobal(key)
    local bagKey = AW.STATEBAG_PREFIX .. key
    return GlobalState[bagKey]
end

-- ============================================================
-- TIER 3: PERSISTENT (via write-behind to Database)
-- ============================================================

--- Mark persistent data as dirty (will be flushed by write-behind)
---@param awid string
---@param section string e.g., 'stats', 'ranking', 'inventory'
function State.MarkPersistentDirty(awid, section)
    persistentDirty[awid .. ':' .. section] = true
    CoreIdentity.MarkDirty(awid, section)
end

--- Get all dirty persistent keys
---@return table
function State.GetDirtyPersistent()
    return persistentDirty
end

--- Clear dirty flag after flush
---@param awid string
---@param section string
function State.ClearPersistentDirty(awid, section)
    persistentDirty[awid .. ':' .. section] = nil
end

--- Clear all dirty flags for a player
---@param awid string
function State.ClearAllPlayerDirty(awid)
    local prefix = awid .. ':'
    for k in pairs(persistentDirty) do
        if k:sub(1, #prefix) == prefix then
            persistentDirty[k] = nil
        end
    end
end

-- ============================================================
-- STATE SNAPSHOT (for UI/sync)
-- ============================================================

--- Get a snapshot of player-visible state
---@param awid string
---@return table
function State.GetPlayerSnapshot(awid)
    local player = CoreIdentity.GetPlayer(awid)
    if not player then return {} end

    return {
        awid = player.awid,
        name = player.name,
        callsign = player.callsign,
        factionId = player.factionId,
        state = player.state,
        stats = player.stats,
        ranking = player.ranking,
    }
end

--- Clean up all state for a removed entity/player
---@param namespace string
function State.Cleanup(namespace)
    State.RemoveVolatile(namespace)
    -- Replicated state cleans up automatically when entity is deleted
    CoreLogger.Debug('state', 'Cleaned up state for namespace: %s', namespace)
end

-- ============================================================
-- DEBUG
-- ============================================================

function State.GetVolatileCount()
    local count = 0
    for _ in pairs(volatile) do count = count + 1 end
    return count
end

function State.GetReplicatedCount()
    local count = 0
    for _ in pairs(replicated) do count = count + 1 end
    return count
end

function State.GetDirtyCount()
    local count = 0
    for _ in pairs(persistentDirty) do count = count + 1 end
    return count
end

CoreState = State
