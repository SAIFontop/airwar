-- aw-loading: client-side shutdown handler
-- Waits for spawn then smoothly shuts down the loading screen

local shutdownRequested = false

AddEventHandler('onClientResourceStart', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end
    shutdownRequested = false
end)

RegisterNetEvent('aw:loading:shutdown')
AddEventHandler('aw:loading:shutdown', function()
    shutdownRequested = true
end)

-- Wait for player to fully spawn, then fade out loading screen
Citizen.CreateThread(function()
    while not shutdownRequested do
        Citizen.Wait(500)
    end

    -- Send shutdown signal to NUI
    SendNUIMessage({ type = 'shutdown' })

    -- Wait for fade animation
    Citizen.Wait(2000)

    -- Kill the loading screen
    ShutdownLoadingScreenNui()
end)

-- Auto-shutdown after player is fully loaded (fallback)
AddEventHandler('playerSpawned', function()
    Citizen.Wait(3000)
    if not shutdownRequested then
        shutdownRequested = true
        SendNUIMessage({ type = 'shutdown' })
        Citizen.Wait(2000)
        ShutdownLoadingScreenNui()
    end
end)
