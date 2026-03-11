--[[
    Client State
    Client-side state manager — receives replicated state from server,
    provides local volatile state, and bridges to NUI
]]

ClientState = {}

local localState = {}  -- Volatile client-side state
local receivedState = {} -- Last state sync from server

function ClientState.Init()
    -- Listen for state sync from server
    RegisterNetEvent(AW.EVENT.STATE_SYNC)
    AddEventHandler(AW.EVENT.STATE_SYNC, function(namespace, data)
        receivedState[namespace] = data
    end)

    -- Listen for batch state updates
    RegisterNetEvent(AW.EVENT.STATE_BATCH)
    AddEventHandler(AW.EVENT.STATE_BATCH, function(batch)
        for ns, data in pairs(batch) do
            receivedState[ns] = data
        end
    end)

    CoreLogger.Info('client:state', 'Client state system initialized')
end

--- Get a value from the server-replicated state
---@param namespace string
---@param key string|nil
---@return any
function ClientState.GetServer(namespace, key)
    local ns = receivedState[namespace]
    if not ns then return nil end
    if key then return ns[key] end
    return ns
end

--- Get/Set local volatile state (client-only, not synced)
---@param key string
---@param value any|nil If nil, acts as getter
---@return any
function ClientState.Local(key, value)
    if value ~= nil then
        localState[key] = value
        return value
    end
    return localState[key]
end

--- Read a StateBag value from an entity
---@param entity number Entity handle
---@param key string
---@return any
function ClientState.GetEntityState(entity, key)
    if not DoesEntityExist(entity) then return nil end
    return Entity(entity).state[key]
end

--- Send a state snapshot to NUI
---@param panel string Panel name (e.g., 'hud', 'hangar')
---@param data table Data to send
function ClientState.PushToNUI(panel, data)
    SendNUIMessage({
        type  = 'state_update',
        panel = panel,
        data  = data,
    })
end
