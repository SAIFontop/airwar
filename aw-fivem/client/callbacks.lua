-- ═══════════════════════════════════════════════════════════
-- Client Callbacks (request data from server)
-- ═══════════════════════════════════════════════════════════

Core.Callback = {}

local _pending = {}
local _nextId = 1

function Core.Callback.Trigger(name, ...)
    local requestId = _nextId
    _nextId = _nextId + 1

    local p = promise.new()
    _pending[requestId] = p

    TriggerServerEvent(AW.EVENT.CALLBACK, name, requestId, ...)

    return Citizen.Await(p)
end

RegisterNetEvent(AW.EVENT.CALLBACK_RESP)
AddEventHandler(AW.EVENT.CALLBACK_RESP, function(requestId, success, data)
    local p = _pending[requestId]
    if p then
        _pending[requestId] = nil
        p:resolve(data)
    end
end)
