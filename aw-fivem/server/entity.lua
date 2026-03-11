-- ═══════════════════════════════════════════════════════════
-- System 15: Entity Manager
-- Server-side entity tracking with auto-cleanup
-- ═══════════════════════════════════════════════════════════

Core.Entity = {}

local _entities = {} -- { [netId] = { entity, netId, type, owner, data, createdAt } }

function Core.Entity.Register(entity, type, data)
    if not DoesEntityExist(entity) then return nil end
    local netId = NetworkGetNetworkIdFromEntity(entity)
    _entities[netId] = {
        entity    = entity,
        netId     = netId,
        type      = type or 'unknown',
        owner     = NetworkGetEntityOwner(entity),
        data      = data or {},
        createdAt = GetGameTimer(),
    }
    return netId
end

function Core.Entity.Get(netId)
    return _entities[netId]
end

function Core.Entity.GetByEntity(entity)
    if not DoesEntityExist(entity) then return nil end
    return _entities[NetworkGetNetworkIdFromEntity(entity)]
end

function Core.Entity.Remove(netId)
    local entry = _entities[netId]
    if not entry then return false end
    if DoesEntityExist(entry.entity) then
        DeleteEntity(entry.entity)
    end
    _entities[netId] = nil
    return true
end

function Core.Entity.GetAll(type)
    if not type then return _entities end
    local filtered = {}
    for netId, data in pairs(_entities) do
        if data.type == type then filtered[netId] = data end
    end
    return filtered
end

function Core.Entity.SetData(netId, key, value)
    if _entities[netId] then
        _entities[netId].data[key] = value
    end
end

function Core.Entity.Count(type)
    if not type then return Utils.TableCount(_entities) end
    local n = 0
    for _, e in pairs(_entities) do
        if e.type == type then n = n + 1 end
    end
    return n
end

function Core.Entity.Cleanup()
    for netId, entry in pairs(_entities) do
        if not DoesEntityExist(entry.entity) then
            _entities[netId] = nil
        end
    end
end

function Core.Entity._init()
    Core.Timer.SetInterval(30000, Core.Entity.Cleanup, 'entity_cleanup')

    Core.Events.On(AW.EVENT.PLAYER_DROPPED, function(source)
        for netId, entry in pairs(_entities) do
            if entry.owner == source then
                Core.Entity.Remove(netId)
            end
        end
    end)

    Core.Log.Info('core', 'Entity manager initialized')
end
