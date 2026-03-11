-- ═══════════════════════════════════════════════════════════
-- System 11: Server Callbacks
-- Client requests data → Server responds asynchronously
-- ═══════════════════════════════════════════════════════════

Core.Callback = {}

local _callbacks = {}

function Core.Callback.Register(name, handler)
    _callbacks[name] = handler
end

RegisterNetEvent(AW.EVENT.CALLBACK)
AddEventHandler(AW.EVENT.CALLBACK, function(name, requestId, ...)
    local src = source
    if not Core.Security.CheckRate(src, 'callback:' .. name) then return end

    local handler = _callbacks[name]
    if not handler then
        TriggerClientEvent(AW.EVENT.CALLBACK_RESP, src, requestId, false, 'Unknown callback: ' .. name)
        return
    end

    local ok, result = Core.Error.Try(handler, src, ...)
    if ok then
        TriggerClientEvent(AW.EVENT.CALLBACK_RESP, src, requestId, true, result)
    else
        TriggerClientEvent(AW.EVENT.CALLBACK_RESP, src, requestId, false, 'Server error')
    end
end)

function Core.Callback._init()
    Core.Log.Info('core', 'Callback system initialized')
end
