--[[
    Handler: onResourceStop
    Graceful shutdown when aw-core resource stops
]]

AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end

    CoreLifecycle.Shutdown('resource_stop')
end)
