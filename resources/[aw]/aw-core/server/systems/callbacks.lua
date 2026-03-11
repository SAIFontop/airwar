--[[
    System 12: Callbacks
    Server↔Client request-response pattern
]]

local Callbacks = {}
Callbacks.__index = Callbacks

local registeredCallbacks = {} -- { [name] = handler }
local pendingCallbacks = {}    -- { [cbId] = { resolve, timeout } }
local nextCbId = 1

-- ============================================================
-- SERVER-SIDE API
-- ============================================================

function Callbacks.Init()
    -- Listen for client callback requests
    RegisterNetEvent(AW.EVENT.CALLBACK_REQUEST)
    AddEventHandler(AW.EVENT.CALLBACK_REQUEST, function(cbName, cbId, data)
        local src = source
        local player = CoreIdentity.GetPlayerByServerId(src)
        if not player then return end

        local handler = registeredCallbacks[cbName]
        if not handler then
            CoreLogger.Warn('callbacks', 'Unknown callback requested: %s (from %s)', cbName, player.awid)
            TriggerClientEvent(AW.EVENT.CALLBACK_RESPONSE, src, cbId, false, 'Unknown callback')
            return
        end

        local ok, result = pcall(handler, player, data)
        if ok then
            TriggerClientEvent(AW.EVENT.CALLBACK_RESPONSE, src, cbId, true, result)
        else
            CoreLogger.Error('callbacks', 'Callback "%s" error: %s', cbName, tostring(result))
            TriggerClientEvent(AW.EVENT.CALLBACK_RESPONSE, src, cbId, false, 'Server error')
        end
    end)

    -- Listen for client callback responses (when server calls client)
    RegisterNetEvent(AW.EVENT.CALLBACK_RESPONSE)
    AddEventHandler(AW.EVENT.CALLBACK_RESPONSE, function(cbId, success, data)
        local pending = pendingCallbacks[cbId]
        if pending then
            pendingCallbacks[cbId] = nil
            pending.resolve(success, data)
        end
    end)

    CoreLogger.Info('callbacks', 'Callback system initialized')
end

--- Register a server callback handler
---@param name string
---@param handler function (player, data) -> result
function Callbacks.Register(name, handler)
    registeredCallbacks[name] = handler
    CoreLogger.Debug('callbacks', 'Registered callback: %s', name)
end

--- Call a client callback (server → client → server)
---@param serverId number Target player
---@param name string Callback name
---@param data any Payload
---@param timeout number|nil Timeout in ms (default 10000)
---@return boolean success
---@return any result
function Callbacks.CallClient(serverId, name, data, timeout)
    timeout = timeout or 10000
    local cbId = nextCbId
    nextCbId = nextCbId + 1

    local resolved = false
    local result = { false, 'Timeout' }

    pendingCallbacks[cbId] = {
        resolve = function(success, response)
            resolved = true
            result = { success, response }
        end,
    }

    TriggerClientEvent(AW.EVENT.CALLBACK_REQUEST, serverId, name, cbId, data)

    -- Wait for response with timeout
    local deadline = GetGameTimer() + timeout
    while not resolved and GetGameTimer() < deadline do
        Wait(50)
    end

    if not resolved then
        pendingCallbacks[cbId] = nil
        CoreLogger.Warn('callbacks', 'Callback "%s" to player %d timed out', name, serverId)
    end

    return result[1], result[2]
end

--- Get registered callback count
---@return number
function Callbacks.GetRegisteredCount()
    return Utils.TableCount(registeredCallbacks)
end

CoreCallbacks = Callbacks
