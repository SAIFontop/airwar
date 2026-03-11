--[[
    aw-admin/client.lua
    Admin client-side: teleport, spectate, god mode, debug overlay
]]

-- ─── State ───────────────────────────────────────────────────────────
local isGodMode = false
local isSpectating = false
local spectateCam = nil
local spectateTarget = nil
local debugOverlay = false

-- ─── Teleport ────────────────────────────────────────────────────────
RegisterNetEvent('aw:admin:teleport', function(x, y, z)
    local ped = PlayerPedId()
    SetEntityCoords(ped, x, y, z + 2.0, false, false, false, false)
    -- If in vehicle, teleport vehicle too
    local veh = GetVehiclePedIsIn(ped, false)
    if veh ~= 0 then
        SetEntityCoords(veh, x, y, z + 2.0, false, false, false, false)
    end
end)

-- ─── God Mode ────────────────────────────────────────────────────────
RegisterNetEvent('aw:admin:godmode', function(enabled)
    isGodMode = enabled
    local ped = PlayerPedId()
    SetEntityInvincible(ped, enabled)

    local veh = GetVehiclePedIsIn(ped, false)
    if veh ~= 0 then
        SetEntityInvincible(veh, enabled)
    end
end)

-- Keep god mode on vehicle changes
CreateThread(function()
    while true do
        if isGodMode then
            local ped = PlayerPedId()
            SetEntityInvincible(ped, true)
            local veh = GetVehiclePedIsIn(ped, false)
            if veh ~= 0 then
                SetEntityInvincible(veh, true)
                SetEntityHealth(veh, GetEntityMaxHealth(veh))
                SetVehicleEngineHealth(veh, 1000.0)
                SetVehicleBodyHealth(veh, 1000.0)
            end
        end
        Wait(isGodMode and 500 or 2000)
    end
end)

-- ─── Spectate ────────────────────────────────────────────────────────
RegisterNetEvent('aw:admin:spectate', function(targetSource)
    if isSpectating then stopSpectate() end

    spectateTarget = targetSource
    isSpectating = true

    local ped = PlayerPedId()
    FreezeEntityPosition(ped, true)
    SetEntityVisible(ped, false, false)
    SetEntityCollision(ped, false, false)

    -- Camera follows target
    spectateCam = CreateCam('DEFAULT_SCRIPTED_CAMERA', true)
    SetCamActive(spectateCam, true)
    RenderScriptCams(true, true, 500, true, true)

    CreateThread(function()
        while isSpectating do
            local targetPed = GetPlayerPed(GetPlayerFromServerId(spectateTarget))
            if DoesEntityExist(targetPed) then
                local pos = GetEntityCoords(targetPed)
                local fwd = GetEntityForwardVector(targetPed)
                SetCamCoord(spectateCam, pos.x - fwd.x * 10.0, pos.y - fwd.y * 10.0, pos.z + 4.0)
                PointCamAtEntity(spectateCam, targetPed, 0.0, 0.0, 0.0, true)
            end
            Wait(0)
        end
    end)
end)

RegisterNetEvent('aw:admin:spectate_stop', function()
    stopSpectate()
end)

function stopSpectate()
    isSpectating = false
    spectateTarget = nil

    if spectateCam then
        SetCamActive(spectateCam, false)
        DestroyCam(spectateCam, false)
        RenderScriptCams(false, true, 500, true, true)
        spectateCam = nil
    end

    local ped = PlayerPedId()
    FreezeEntityPosition(ped, false)
    SetEntityVisible(ped, true, false)
    SetEntityCollision(ped, true, true)
end

-- ─── Debug Overlay ───────────────────────────────────────────────────
RegisterNetEvent('aw:admin:debug_toggle', function()
    debugOverlay = not debugOverlay
end)

CreateThread(function()
    while true do
        if debugOverlay then
            local ped = PlayerPedId()
            local pos = GetEntityCoords(ped)
            local veh = GetVehiclePedIsIn(ped, false)

            local lines = {
                string.format('POS: %.1f, %.1f, %.1f', pos.x, pos.y, pos.z),
                string.format('HEADING: %.1f', GetEntityHeading(ped)),
                string.format('ENTITIES: ~y~%d', #GetGamePool('CObject') + #GetGamePool('CVehicle') + #GetGamePool('CPed')),
                string.format('VEHICLES: ~y~%d', #GetGamePool('CVehicle')),
            }

            if veh ~= 0 then
                lines[#lines + 1] = string.format('VEH HP: E=%.0f B=%.0f', GetVehicleEngineHealth(veh), GetVehicleBodyHealth(veh))
                lines[#lines + 1] = string.format('SPEED: %.1f kts', GetEntitySpeed(veh) * 1.94384)
                lines[#lines + 1] = string.format('ALT: %.0f ft', pos.z * 3.28084)
            end

            for i, line in ipairs(lines) do
                SetTextFont(0)
                SetTextScale(0.0, 0.3)
                SetTextColour(0, 255, 136, 200)
                SetTextDropshadow(1, 0, 0, 0, 255)
                SetTextEdge(1, 0, 0, 0, 255)
                SetTextOutline()
                SetTextEntry('STRING')
                AddTextComponentString(line)
                DrawText(0.01, 0.3 + (i - 1) * 0.018)
            end
        end
        Wait(debugOverlay and 0 or 1000)
    end
end)
