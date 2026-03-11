--[[
    aw-respawn — Client Spectate, Timer Display, Aircraft Selection, Respawn Execution
    
    Responsibilities:
    1. Spectate camera during respawn timer
    2. Timer countdown display → NUI
    3. Aircraft selection after timer expires
    4. Execute respawn (spawn aircraft at base)
]]

-- ============================================================
-- CLIENT STATE
-- ============================================================

local isRespawning = false
local spectateMode = 'freecam'   -- 'freecam' | 'killer' | 'cycle'
local timerDuration = 0
local timerStarted = 0
local respawnBase = nil
local killerPed = nil
local spectateCam = nil
local cycleIndex = 1

-- ============================================================
-- SPECTATE MODE
-- ============================================================

--- Enter spectate after death
RegisterNetEvent('aw:respawn:enter_spectate')
AddEventHandler('aw:respawn:enter_spectate', function(data)
    isRespawning = true
    timerDuration = data.duration or 15
    timerStarted = GetGameTimer()
    respawnBase = data.base

    -- Detach player from destroyed vehicle
    local ped = PlayerPedId()
    if IsPedInAnyVehicle(ped, false) then
        TaskLeaveVehicle(ped, GetVehiclePedIsIn(ped, false), 16)
    end

    Wait(500)

    -- Freeze player and make invisible
    local ped = PlayerPedId()
    SetEntityVisible(ped, false, false)
    SetEntityInvincible(ped, true)
    FreezeEntityPosition(ped, true)

    -- Setup spectate camera
    if data.killer then
        -- Try to follow killer
        startKillerCam(data.killer)
    else
        startFreeCam()
    end

    -- Start timer display
    startTimerNui()
end)

--- Timer expired — show aircraft selection
RegisterNetEvent('aw:respawn:timer_expired')
AddEventHandler('aw:respawn:timer_expired', function(data)
    respawnBase = data.base

    -- Push aircraft selection UI
    SendNUIMessage({
        type = 'respawn_select',
        data = {
            base    = data.base,
            show    = true,
        }
    })
    SetNuiFocus(true, true)
end)

--- Execute respawn
RegisterNetEvent('aw:respawn:execute')
AddEventHandler('aw:respawn:execute', function(data)
    if not data then return end

    cleanup()

    local ped = PlayerPedId()

    -- Unfreeze player
    SetEntityVisible(ped, true, true)
    SetEntityInvincible(ped, false)
    FreezeEntityPosition(ped, false)

    -- Teleport to base
    local pos = data.position
    if pos then
        SetEntityCoords(ped, pos.x, pos.y, pos.z + 200.0, false, false, false, false)
    end

    -- Request aircraft spawn via aw-aircraft
    TriggerServerEvent('aw:aircraft:request_spawn', {
        type_id  = data.aircraft_type,
        position = pos and vector3(pos.x, pos.y, pos.z + 200.0) or nil,
        heading  = data.heading or 0,
        faction  = data.faction,
    })
end)

--- Error from server
RegisterNetEvent('aw:respawn:error')
AddEventHandler('aw:respawn:error', function(msg)
    SendNUIMessage({
        type = 'respawn_error',
        data = { message = msg }
    })
end)

-- ============================================================
-- CAMERA SYSTEMS
-- ============================================================

function startFreeCam()
    spectateMode = 'freecam'
    destroyCam()

    local ped = PlayerPedId()
    local pos = GetEntityCoords(ped)

    spectateCam = CreateCam('DEFAULT_SCRIPTED_CAMERA', true)
    SetCamCoord(spectateCam, pos.x, pos.y, pos.z + 50.0)
    PointCamAtCoord(spectateCam, pos.x, pos.y, pos.z)
    SetCamActive(spectateCam, true)
    RenderScriptCams(true, true, 1000, true, true)
end

function startKillerCam(killerAwid)
    spectateMode = 'killer'
    -- Killer tracking would need server to send killer's source
    -- For now, default to free cam
    startFreeCam()
end

function startCycleCam()
    spectateMode = 'cycle'
    destroyCam()

    local players = GetActivePlayers()
    if #players == 0 then
        startFreeCam()
        return
    end

    cycleIndex = ((cycleIndex - 1) % #players) + 1
    local targetPlayer = players[cycleIndex]
    local targetPed = GetPlayerPed(targetPlayer)

    if DoesEntityExist(targetPed) then
        spectateCam = CreateCam('DEFAULT_SCRIPTED_CAMERA', true)
        local tPos = GetEntityCoords(targetPed)
        SetCamCoord(spectateCam, tPos.x - 10, tPos.y - 10, tPos.z + 5)
        PointCamAtEntity(spectateCam, targetPed, 0.0, 0.0, 0.0, true)
        SetCamActive(spectateCam, true)
        RenderScriptCams(true, true, 500, true, true)
    else
        startFreeCam()
    end
end

function destroyCam()
    if spectateCam then
        SetCamActive(spectateCam, false)
        DestroyCam(spectateCam, true)
        RenderScriptCams(false, true, 500, true, true)
        spectateCam = nil
    end
end

-- ============================================================
-- NUI TIMER
-- ============================================================

function startTimerNui()
    SendNUIMessage({
        type = 'respawn_timer',
        data = {
            show     = true,
            duration = timerDuration,
        }
    })
end

function updateTimerNui()
    if not isRespawning then return end
    local elapsed = (GetGameTimer() - timerStarted) / 1000
    local remaining = math.max(0, timerDuration - elapsed)

    SendNUIMessage({
        type = 'respawn_timer_update',
        data = {
            remaining = remaining,
            elapsed   = elapsed,
        }
    })
end

-- ============================================================
-- NUI CALLBACKS
-- ============================================================

--- Aircraft selection from NUI
RegisterNUICallback('respawn_select_aircraft', function(data, cb)
    if not data or not data.aircraft_type then
        cb({ ok = false })
        return
    end

    SetNuiFocus(false, false)

    TriggerServerEvent('aw:respawn:request_spawn', {
        aircraft_type = data.aircraft_type,
    })

    cb({ ok = true })
end)

-- ============================================================
-- INPUT HANDLING (SPECTATE)
-- ============================================================

CreateThread(function()
    while true do
        Wait(0)
        if isRespawning then
            -- Arrow keys to cycle spectate
            if IsControlJustPressed(0, 175) then -- RIGHT
                cycleIndex = cycleIndex + 1
                startCycleCam()
            end
            if IsControlJustPressed(0, 174) then -- LEFT
                cycleIndex = cycleIndex - 1
                if cycleIndex < 1 then cycleIndex = 1 end
                startCycleCam()
            end

            -- F = toggle free cam
            if IsControlJustPressed(0, 75) then
                if spectateMode == 'freecam' then
                    startCycleCam()
                else
                    startFreeCam()
                end
            end

            -- Timer NUI update every frame
            updateTimerNui()

            -- Disable all controls except camera
            DisableAllControlActions(0)
            EnableControlAction(0, 1, true)  -- Look LR
            EnableControlAction(0, 2, true)  -- Look UD
            EnableControlAction(0, 174, true) -- Left
            EnableControlAction(0, 175, true) -- Right
            EnableControlAction(0, 75, true)  -- F
        end
    end
end)

-- ============================================================
-- CLEANUP
-- ============================================================

function cleanup()
    isRespawning = false
    destroyCam()

    SendNUIMessage({
        type = 'respawn_timer',
        data = { show = false }
    })
    SendNUIMessage({
        type = 'respawn_select',
        data = { show = false }
    })
    SetNuiFocus(false, false)
end

AddEventHandler('onResourceStop', function(resource)
    if resource ~= GetCurrentResourceName() then return end
    cleanup()

    local ped = PlayerPedId()
    SetEntityVisible(ped, true, true)
    SetEntityInvincible(ped, false)
    FreezeEntityPosition(ped, false)
end)
