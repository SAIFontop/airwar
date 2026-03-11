--[[
    aw-aircraft — Client-side Aircraft Systems
    
    Responsibilities:
    1. Vehicle entry/exit handling
    2. Flight state reporting to server (speed, altitude, heading)
    3. Flight augmentation (damage effects on handling)
    4. Fuel gauge / warning display
    5. StateBag reading for aircraft data
    6. HUD data push via Core UI pipeline
]]

-- ============================================================
-- CLIENT STATE
-- ============================================================

local AWAircraftClient = {}
local initialized = false

local myAEID = nil
local myAircraft = nil -- Local runtime data
local myVehicle = nil  -- Entity handle
local isFlying = false

-- Damage effects state
local damageEffects = {
    thrust_mult  = 1.0,
    roll_mult    = 1.0,
    pitch_mult   = 1.0,
    yaw_mult     = 1.0,
    hud_glitch   = false,
    fuel_leak    = false,
}

-- State report throttle
local REPORT_INTERVAL = 200 -- ms between state reports to server
local lastReport = 0

-- ============================================================
-- FLIGHT STATE REPORTING
-- ============================================================

--- Collect and send flight state to server
local function reportFlightState()
    if not myVehicle or not DoesEntityExist(myVehicle) then return end

    local now = GetGameTimer()
    if (now - lastReport) < REPORT_INTERVAL then return end
    lastReport = now

    local speed = GetEntitySpeed(myVehicle) -- m/s
    local pos = GetEntityCoords(myVehicle)
    local heading = GetEntityHeading(myVehicle)
    local isInAir = not IsEntityOnScreen(myVehicle) or IsEntityInAir(myVehicle)

    -- Detect afterburner (high speed relative to max)
    local speedKnots = speed * 1.944 -- m/s to knots
    local afterburner = speedKnots > 400 -- Rough threshold

    -- Detect combat state (weapons hot, locked, firing)
    local inCombat = false
    if AWClientState then
        local combatState = AWClientState.Get('combat_active')
        if combatState then inCombat = true end
    end

    TriggerServerEvent('aw:aircraft:state_update', {
        speed       = speed,
        altitude    = pos.z,
        heading     = heading,
        is_airborne = isInAir,
        afterburner = afterburner,
        in_combat   = inCombat,
    })
end

-- ============================================================
-- FLIGHT AUGMENTATION (damage effects)
-- ============================================================

--- Calculate handling modifiers from damage zones
---@param healthZones table Zone health percentages
local function updateDamageEffects(healthZones)
    if not healthZones then return end

    -- Engine damage → reduced thrust
    local engineHealth = healthZones[AW.DAMAGE_ZONE.ENGINE] or 100
    damageEffects.thrust_mult = Utils.Clamp(engineHealth / 100, 0.1, 1.0)

    -- Wing damage → reduced roll/pitch
    local leftWing = healthZones[AW.DAMAGE_ZONE.LEFT_WING] or 100
    local rightWing = healthZones[AW.DAMAGE_ZONE.RIGHT_WING] or 100
    local avgWing = (leftWing + rightWing) / 2
    damageEffects.roll_mult = Utils.Clamp(avgWing / 100, 0.2, 1.0)
    damageEffects.pitch_mult = Utils.Clamp(avgWing / 100, 0.3, 1.0)

    -- Tail damage → reduced yaw
    local tailHealth = healthZones[AW.DAMAGE_ZONE.TAIL] or 100
    damageEffects.yaw_mult = Utils.Clamp(tailHealth / 100, 0.2, 1.0)

    -- Avionics damage → HUD glitches
    local avionicsHealth = healthZones[AW.DAMAGE_ZONE.AVIONICS] or 100
    damageEffects.hud_glitch = avionicsHealth < 50

    -- Fuel tank → leak indicator
    local fuelTankHealth = healthZones[AW.DAMAGE_ZONE.FUEL_TANK] or 100
    damageEffects.fuel_leak = fuelTankHealth < 50

    -- Asymmetric wing damage → drift
    local wingDiff = math.abs(leftWing - rightWing)
    damageEffects.drift_force = wingDiff / 100 * 0.5 -- Max 0.5 drift when one wing destroyed
    damageEffects.drift_direction = leftWing < rightWing and -1 or 1
end

--- Apply flight augmentation to the vehicle each frame
local function applyFlightAugmentation()
    if not myVehicle or not DoesEntityExist(myVehicle) then return end
    if not IsEntityInAir(myVehicle) then return end

    -- Apply thrust reduction
    if damageEffects.thrust_mult < 1.0 then
        local currentSpeed = GetEntitySpeed(myVehicle)
        local maxSpeed = GetVehicleEstimatedMaxSpeed(myVehicle)
        if currentSpeed > maxSpeed * damageEffects.thrust_mult then
            -- Gently reduce speed
            local reducedSpeed = currentSpeed * 0.995
            SetEntityMaxSpeed(myVehicle, maxSpeed * damageEffects.thrust_mult)
        end
    end

    -- Apply asymmetric drift (wing damage)
    if damageEffects.drift_force > 0.01 then
        local rot = GetEntityRotation(myVehicle)
        ApplyForceToEntity(
            myVehicle, 1,
            damageEffects.drift_direction * damageEffects.drift_force, 0.0, 0.0,
            0.0, 0.0, 0.0,
            0, true, true, true, false, true
        )
    end
end

-- ============================================================
-- HUD DATA PUSH
-- ============================================================

--- Push flight data to HUD via Core UI system
local function pushHUDData()
    if not myVehicle or not DoesEntityExist(myVehicle) then return end

    local speed = GetEntitySpeed(myVehicle)
    local pos = GetEntityCoords(myVehicle)
    local heading = GetEntityHeading(myVehicle)
    local rot = GetEntityRotation(myVehicle)

    -- Read fuel from StateBag
    local fuel = Entity(myVehicle).state[AW.STATEBAG_PREFIX .. 'fuel'] or 0
    local healthJson = Entity(myVehicle).state[AW.STATEBAG_PREFIX .. 'health']
    local healthZones = healthJson and json.decode(healthJson) or {}

    local hudData = {
        speed       = speed * 1.944, -- knots
        altitude    = pos.z * 3.281, -- feet
        heading     = heading,
        fuel        = fuel,
        throttle    = GetVehicleCurrentGear(myVehicle) or 0,
        pitch       = rot.x,
        roll        = rot.y,
        aeid        = myAEID,
        type_id     = myAircraft and myAircraft.type_id or nil,
        health      = healthZones,
        warnings    = {},
        damage_fx   = damageEffects,
    }

    -- Warnings
    if fuel <= 10 then
        hudData.warnings[#hudData.warnings + 1] = fuel <= 5 and 'FUEL_CRITICAL' or 'FUEL_LOW'
    end
    if damageEffects.hud_glitch then
        hudData.warnings[#hudData.warnings + 1] = 'AVIONICS_DAMAGE'
    end
    if damageEffects.fuel_leak then
        hudData.warnings[#hudData.warnings + 1] = 'FUEL_LEAK'
    end
    if damageEffects.thrust_mult < 0.5 then
        hudData.warnings[#hudData.warnings + 1] = 'ENGINE_CRITICAL'
    end

    -- Send to NUI
    SendNUIMessage({
        type  = 'hud_update',
        panel = 'hud',
        state = hudData,
    })
end

-- ============================================================
-- VEHICLE ENTER / EXIT
-- ============================================================

--- Handle aircraft spawned event from server
RegisterNetEvent(AW.EVENT.AIRCRAFT_SPAWNED, function(data)
    myAEID = data.aeid
    myAircraft = data

    -- Get the vehicle entity from network ID
    local timeout = 50
    while not NetworkDoesNetworkIdExist(data.net_id) and timeout > 0 do
        Wait(100)
        timeout = timeout - 1
    end

    if NetworkDoesNetworkIdExist(data.net_id) then
        myVehicle = NetworkGetEntityFromNetworkId(data.net_id)

        -- Wait for entity
        timeout = 50
        while not DoesEntityExist(myVehicle) and timeout > 0 do
            Wait(100)
            timeout = timeout - 1
        end

        if DoesEntityExist(myVehicle) then
            -- Warp player into pilot seat
            local ped = PlayerPedId()
            TaskWarpPedIntoVehicle(ped, myVehicle, -1)
            isFlying = true
        end
    end
end)

--- Handle aircraft despawned
RegisterNetEvent(AW.EVENT.AIRCRAFT_DESPAWNED, function(data)
    if data.aeid == myAEID then
        myAEID = nil
        myAircraft = nil
        myVehicle = nil
        isFlying = false
        damageEffects = {
            thrust_mult = 1.0, roll_mult = 1.0, pitch_mult = 1.0, yaw_mult = 1.0,
            hud_glitch = false, fuel_leak = false, drift_force = 0, drift_direction = 1,
        }

        -- Clear HUD
        SendNUIMessage({ type = 'hud_update', panel = 'hud', state = nil })
    end
end)

--- Handle aircraft destroyed (all clients receive this for explosion FX)
RegisterNetEvent(AW.EVENT.AIRCRAFT_DESTROYED, function(data)
    if data.net_id and NetworkDoesNetworkIdExist(data.net_id) then
        local entity = NetworkGetEntityFromNetworkId(data.net_id)
        if DoesEntityExist(entity) then
            local pos = GetEntityCoords(entity)
            -- Large explosion effect
            AddExplosion(pos.x, pos.y, pos.z, 0, 5.0, true, false, 1.0)
        end
    end

    -- If it's our aircraft, clean up
    if data.aeid == myAEID then
        myAEID = nil
        myAircraft = nil
        myVehicle = nil
        isFlying = false
    end
end)

--- Handle damage update from server
RegisterNetEvent(AW.EVENT.AIRCRAFT_DAMAGED, function(data)
    if data.aeid ~= myAEID then return end

    -- Read updated health from StateBag
    if myVehicle and DoesEntityExist(myVehicle) then
        local healthJson = Entity(myVehicle).state[AW.STATEBAG_PREFIX .. 'health']
        if healthJson then
            local zones = json.decode(healthJson)
            updateDamageEffects(zones)
        end
    end
end)

--- Fuel warning from server
RegisterNetEvent('aw:aircraft:fuel_warning', function(data)
    if data.aeid ~= myAEID then return end
    -- Audio warning
    PlaySoundFrontend(-1, 'TIMER_STOP', 'HUD_MINI_GAME_SOUNDSET', true)
end)

--- Fuel empty from server
RegisterNetEvent('aw:aircraft:fuel_empty', function(data)
    if data.aeid ~= myAEID then return end
    -- Disable engine
    if myVehicle and DoesEntityExist(myVehicle) then
        SetVehicleEngineOn(myVehicle, false, true, true)
    end
    PlaySoundFrontend(-1, 'WEAPON_PURCHASE', 'HUD_AMMO_SHOP_SOUNDSET', true)
end)

-- ============================================================
-- MAIN LOOPS
-- ============================================================

-- Flight augmentation loop (every frame when flying)
CreateThread(function()
    while true do
        if isFlying and myVehicle then
            applyFlightAugmentation()
            reportFlightState()
            Wait(0) -- Every frame
        else
            Wait(500) -- Idle when not flying
        end
    end
end)

-- HUD push loop (throttled to HUD rate)
CreateThread(function()
    local interval = math.floor(1000 / AW.TICK.HUD_PUSH)
    while true do
        if isFlying and myVehicle then
            pushHUDData()
        end
        Wait(interval)
    end
end)

-- Vehicle exit detection
CreateThread(function()
    while true do
        Wait(1000)
        if isFlying and myVehicle then
            local ped = PlayerPedId()
            if not IsPedInVehicle(ped, myVehicle, false) then
                -- Player exited the aircraft
                isFlying = false
                TriggerServerEvent('aw:aircraft:exited', { aeid = myAEID })
            end
        end
    end
end)

-- ============================================================
-- INITIALIZATION
-- ============================================================

RegisterNetEvent(AW.EVENT.CORE_READY, function()
    if initialized then return end
    initialized = true
end)
