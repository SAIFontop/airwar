--[[
    Client Callbacks
    Client-side callback system: handles server→client requests and client→server requests
]]

ClientCallbacks = {}

local registeredCallbacks = {} -- { [name] = handler }
local pendingCallbacks = {}    -- { [cbId] = { resolve } }
local nextCbId = 1

function ClientCallbacks.Init()
    -- Server is calling the client
    RegisterNetEvent(AW.EVENT.CALLBACK_REQUEST)
    AddEventHandler(AW.EVENT.CALLBACK_REQUEST, function(cbName, cbId, data)
        local handler = registeredCallbacks[cbName]
        if not handler then
            TriggerServerEvent(AW.EVENT.CALLBACK_RESPONSE, cbId, false, 'Unknown client callback')
            return
        end

        local ok, result = pcall(handler, data)
        if ok then
            TriggerServerEvent(AW.EVENT.CALLBACK_RESPONSE, cbId, true, result)
        else
            TriggerServerEvent(AW.EVENT.CALLBACK_RESPONSE, cbId, false, 'Client callback error')
        end
    end)

    -- Server is responding to our request
    RegisterNetEvent(AW.EVENT.CALLBACK_RESPONSE)
    AddEventHandler(AW.EVENT.CALLBACK_RESPONSE, function(cbId, success, data)
        local pending = pendingCallbacks[cbId]
        if pending then
            pendingCallbacks[cbId] = nil
            pending.resolve(success, data)
        end
    end)

    CoreLogger.Info('client:callbacks', 'Client callback system initialized')
end

--- Register a client-side callback handler (server can call this)
---@param name string
---@param handler function (data) -> result
function ClientCallbacks.Register(name, handler)
    registeredCallbacks[name] = handler
end

--- Call a server callback from client (client → server → client)
---@param name string
---@param data any
---@param timeout number|nil ms (default 10000)
---@return boolean success
---@return any result
function ClientCallbacks.CallServer(name, data, timeout)
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

    TriggerServerEvent(AW.EVENT.CALLBACK_REQUEST, name, cbId, data)

    local deadline = GetGameTimer() + timeout
    while not resolved and GetGameTimer() < deadline do
        Wait(50)
    end

    if not resolved then
        pendingCallbacks[cbId] = nil
    end

    return result[1], result[2]
end
