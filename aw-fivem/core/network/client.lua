-- ═══════════════════════════════════════════════════════════
-- Client Network Wrapper
-- ═══════════════════════════════════════════════════════════

Core.Net = {}

function Core.Net.Register(event, handler)
    local fullEvent = AW.EVENT.NET_PREFIX .. event
    RegisterNetEvent(fullEvent)
    AddEventHandler(fullEvent, handler)
end

function Core.Net.Emit(event, ...)
    TriggerServerEvent(AW.EVENT.NET_PREFIX .. event, ...)
end
