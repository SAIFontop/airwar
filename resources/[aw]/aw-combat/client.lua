--[[
    aw-combat — Client-side Combat
    
    Responsibilities:
    1. Gun raycast hit detection
    2. Report hits to server
    3. Kill feed display events
    4. Hit markers / indicators
]]

-- ============================================================
-- CLIENT STATE
-- ============================================================

local currentAeid = nil
local isInAircraft = false
local hitMarkerTimer = 0

-- ============================================================
-- GUN HIT DETECTION (RAYCAST)
-- ============================================================

--- Perform raycast from aircraft forward direction
---@return table|nil hitData
local function performGunRaycast()
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)
    if veh == 0 then return nil end

    local pos = GetEntityCoords(veh)
    local fwd = GetEntityForwardVector(veh)
    local endPos = pos + (fwd * 2000.0) -- 2km gun range

    local hit, endCoords, _, entityHit = GetShapeTestResult(
        StartShapeTestRay(pos.x, pos.y, pos.z, endPos.x, endPos.y, endPos.z, 2, veh, 0) -- Flag 2 = vehicles
    )

    if hit == 1 and entityHit and entityHit ~= 0 then
        -- Check if the hit entity is a tracked aircraft via StateBag
        local targetAeid = Entity(entityHit).state.aeid
        if targetAeid then
            local distance = #(pos - endCoords)
            -- Calculate angle of attack
            local targetFwd = GetEntityForwardVector(entityHit)
            local toTarget = endCoords - pos
            local angle = math.deg(math.atan2(toTarget.x, toTarget.y) - math.atan2(targetFwd.x, targetFwd.y))
            if angle < 0 then angle = angle + 360 end

            return {
                target_aeid   = targetAeid,
                attacker_aeid = currentAeid,
                distance      = distance,
                angle         = angle,
                position      = endCoords,
            }
        end
    end

    return nil
end

-- ============================================================
-- HIT MARKER
-- ============================================================

local function drawHitMarker()
    if hitMarkerTimer <= 0 then return end

    hitMarkerTimer = hitMarkerTimer - 1

    -- Draw crosshair hit indicator
    local w, h = 0.5, 0.5 -- Screen center
    local size = 0.008

    DrawRect(w - size, h, size * 0.3, 0.002, 255, 50, 50, 220)
    DrawRect(w + size, h, size * 0.3, 0.002, 255, 50, 50, 220)
    DrawRect(w, h - size, 0.002, size * 0.3, 255, 50, 50, 220)
    DrawRect(w, h + size, 0.002, size * 0.3, 255, 50, 50, 220)
end

-- ============================================================
-- EVENT HANDLERS
-- ============================================================

--- Track current aircraft
RegisterNetEvent(AW.EVENT.AIRCRAFT_SPAWNED)
AddEventHandler(AW.EVENT.AIRCRAFT_SPAWNED, function(data)
    if data and data.aeid then
        currentAeid = data.aeid
        isInAircraft = true
    end
end)

RegisterNetEvent(AW.EVENT.AIRCRAFT_DESTROYED)
AddEventHandler(AW.EVENT.AIRCRAFT_DESTROYED, function(data)
    if data and data.aeid == currentAeid then
        currentAeid = nil
        isInAircraft = false
    end
end)

RegisterNetEvent(AW.EVENT.AIRCRAFT_DESPAWNED)
AddEventHandler(AW.EVENT.AIRCRAFT_DESPAWNED, function(data)
    if data and data.aeid == currentAeid then
        currentAeid = nil
        isInAircraft = false
    end
end)

--- Kill event — push to NUI
RegisterNetEvent(AW.EVENT.KILL)
AddEventHandler(AW.EVENT.KILL, function(data)
    SendNUIMessage({
        type = 'kill_feed',
        data = data,
    })
end)

--- Hit confirmed — show hit marker
RegisterNetEvent('aw:combat:hit_confirmed')
AddEventHandler('aw:combat:hit_confirmed', function()
    hitMarkerTimer = 15 -- ~15 frames
    PlaySoundFrontend(-1, 'HITMARKER', 'HUD_MINI_GAME_SOUNDSET', true)
end)

--- CM result
RegisterNetEvent('aw:combat:cm_result')
AddEventHandler('aw:combat:cm_result', function(data)
    if data and data.defeated then
        -- Missile evaded notification
        SendNUIMessage({
            type = 'notification',
            data = { text = 'MISSILE DEFEATED', severity = 'success' },
        })
        PlaySoundFrontend(-1, 'CONFIRM_BEEP', 'HUD_MINI_GAME_SOUNDSET', true)
    else
        SendNUIMessage({
            type = 'notification',
            data = { text = 'CM FAILED — EVADE!', severity = 'danger' },
        })
        PlaySoundFrontend(-1, 'CANCEL', 'HUD_MINI_GAME_SOUNDSET', true)
    end
end)

-- ============================================================
-- GUN HIT DETECTION EVENT (from aw-loadout weapon fire)
-- ============================================================

--- When player fires a gun weapon, check raycast for hit
RegisterNetEvent(AW.EVENT.WEAPON_FIRED)
AddEventHandler(AW.EVENT.WEAPON_FIRED, function(data)
    if not data or not isInAircraft then return end
    if data.type ~= 'gun' then return end

    -- Perform raycast
    local hitData = performGunRaycast()
    if hitData then
        hitData.weapon_id = data.weapon_id
        TriggerServerEvent('aw:combat:hit_report', hitData)
    end
end)

-- ============================================================
-- RENDER LOOP
-- ============================================================

CreateThread(function()
    while true do
        if isInAircraft then
            drawHitMarker()
            Wait(0) -- Every frame for rendering
        else
            Wait(500)
        end
    end
end)
