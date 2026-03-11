-- ═══════════════════════════════════════════════════════════
-- System 10: Network Event Wrapper
-- Secure RegisterNetEvent / TriggerClientEvent abstraction
-- ═══════════════════════════════════════════════════════════

Core.Net = {}

local _registered = {}

function Core.Net.Register(event, handler)
    local fullEvent = AW.EVENT.NET_PREFIX .. event
    _registered[event] = true

    RegisterNetEvent(fullEvent)
    AddEventHandler(fullEvent, function(...)
        local src = source
        if not Core.Security.CheckRate(src, event) then return end
        Core.Error.Try(handler, src, ...)
    end)
end

function Core.Net.Emit(event, target, ...)
    TriggerClientEvent(AW.EVENT.NET_PREFIX .. event, target, ...)
end

function Core.Net.Broadcast(event, ...)
    Core.Net.Emit(event, -1, ...)
end

function Core.Net._init()
    Core.Log.Info('core', 'Network wrapper initialized')
end
