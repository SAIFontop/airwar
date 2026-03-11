-- ═══════════════════════════════════════════════════════════
-- System 8: State Sync (StateBag wrapper)
-- ═══════════════════════════════════════════════════════════

Core.State = {}

-- Global state (all clients see this)
function Core.State.Set(key, value)
    GlobalState[key] = value
end

function Core.State.Get(key)
    return GlobalState[key]
end

-- Per-player state
function Core.State.SetPlayer(source, key, value)
    local player = Player(source)
    if player then
        player.state:set(key, value, true)
    end
end

function Core.State.GetPlayer(source, key)
    local player = Player(source)
    return player and player.state[key] or nil
end

-- Entity state
function Core.State.SetEntity(entity, key, value)
    if DoesEntityExist(entity) then
        Entity(entity).state:set(key, value, true)
    end
end

function Core.State.GetEntity(entity, key)
    if not DoesEntityExist(entity) then return nil end
    return Entity(entity).state[key]
end

-- Set + emit change event
function Core.State.Sync(key, value)
    Core.State.Set(key, value)
    Core.Events.Emit('state:changed', key, value)
end

function Core.State._init()
    Core.Log.Info('core', 'State sync initialized')
end
