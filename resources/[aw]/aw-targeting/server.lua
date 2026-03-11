--[[
    aw-targeting — Server-side Radar & Targeting System
    
    Responsibilities:
    1. Maintain position database of all aircraft
    2. Per-player visibility computation (radar + AWACS + zones)
    3. Fog of war enforcement — only push visible contacts to each player
    4. Lock-on system — validate lock requests, track lock state
    5. RWR (Radar Warning Receiver) — notify targets being locked
]]

-- ============================================================
-- MODULE STATE
-- ============================================================

local TargetingManager = {}
local initialized = false

-- All active aircraft positions: aeid → { pos, velocity, heading, faction, type, owner_awid, source }
local aircraftPositions = {}

-- Per-player visible contacts: awid → { aeid → contact_data }
local playerContacts = {}

-- Active locks: lockId → { attacker_awid, target_aeid, state, progress, weapon_type }
local activeLocks = {}
local nextLockId = 1

-- Lock states
local LOCK_STATE = {
    LOCKING  = 'locking',
    LOCKED   = 'locked',
    BROKEN   = 'broken',
}

-- Default radar config
local DEFAULT_RADAR_RANGE = 8000  -- meters
local DEFAULT_LOCK_CONE = 30       -- degrees

-- ============================================================
-- POSITION TRACKING
-- ============================================================

--- Update aircraft position (called from flight state reports)
---@param aeid string
---@param data table { pos, velocity, heading, speed, altitude }
local function updatePosition(aeid, data)
    if not aircraftPositions[aeid] then
        aircraftPositions[aeid] = {}
    end

    local entry = aircraftPositions[aeid]
    entry.pos       = data.pos or entry.pos
    entry.velocity  = data.velocity or entry.velocity
    entry.heading   = data.heading or entry.heading
    entry.speed     = data.speed or entry.speed
    entry.altitude  = data.altitude or entry.altitude
    entry.last_update = GetGameTimer()
end

--- Register a new aircraft in the tracking system
---@param aeid string
---@param data table
local function registerAircraft(aeid, data)
    aircraftPositions[aeid] = {
        aeid       = aeid,
        pos        = data.position or vector3(0, 0, 0),
        velocity   = vector3(0, 0, 0),
        heading    = data.heading or 0,
        speed      = 0,
        altitude   = 0,
        faction    = data.faction,
        type_id    = data.type_id,
        role       = data.role,
        owner_awid = data.owner_awid,
        source     = data.source,
        last_update = GetGameTimer(),
    }
end

--- Remove aircraft from tracking
---@param aeid string
local function unregisterAircraft(aeid)
    aircraftPositions[aeid] = nil

    -- Break any locks involving this aircraft
    for lockId, lock in pairs(activeLocks) do
        if lock.target_aeid == aeid then
            activeLocks[lockId] = nil
        end
    end
end

-- ============================================================
-- RADAR COMPUTATION
-- ============================================================

--- Get radar range for an aircraft
---@param aeid string
---@return number range in meters
local function getRadarRange(aeid)
    local aircraft = aircraftPositions[aeid]
    if not aircraft or not aircraft.type_id then return DEFAULT_RADAR_RANGE end

    local def = CoreRegistry and CoreRegistry.Get('aircraft', aircraft.type_id)
    if def and def.radar_range then
        -- Reduce range if avionics damaged
        local health = exports['aw-aircraft']:GetZoneHealth(aeid, 'avionics')
        if health then
            return def.radar_range * (health / 100)
        end
        return def.radar_range
    end
    return DEFAULT_RADAR_RANGE
end

--- Compute visible contacts for a specific player
---@param awid string
---@param playerAeid string
---@return table contacts { aeid → contact_data }
local function computeContacts(awid, playerAeid)
    local contacts = {}
    local myAircraft = aircraftPositions[playerAeid]
    if not myAircraft then return contacts end

    local myPos = myAircraft.pos
    local myFaction = myAircraft.faction
    local myRadarRange = getRadarRange(playerAeid)
    local myHeading = myAircraft.heading or 0

    for aeid, target in pairs(aircraftPositions) do
        if aeid == playerAeid then goto next_target end -- Skip self

        local targetPos = target.pos
        if not targetPos or not myPos then goto next_target end

        local distance = #(myPos - targetPos)

        -- Check radar range
        if distance > myRadarRange then goto next_target end

        -- Radar is forward-facing cone (120 degrees)
        local toTarget = targetPos - myPos
        local angleToTarget = math.deg(math.atan2(toTarget.x, toTarget.y))
        if angleToTarget < 0 then angleToTarget = angleToTarget + 360 end
        local angleDiff = math.abs(angleToTarget - myHeading)
        if angleDiff > 180 then angleDiff = 360 - angleDiff end

        if angleDiff > 60 then goto next_target end -- Outside 120° forward cone

        -- IFF classification
        local iff = 'unknown'
        if target.faction then
            if target.faction == myFaction then
                iff = 'friendly'
            else
                iff = 'hostile'
            end
        end

        contacts[aeid] = {
            aeid      = aeid,
            pos       = targetPos,
            velocity  = target.velocity,
            heading   = target.heading,
            speed     = target.speed,
            altitude  = target.altitude,
            distance  = distance,
            bearing   = angleToTarget,
            iff       = iff,
            type      = target.role or 'unknown',
            type_id   = (iff == 'friendly') and target.type_id or nil, -- Only show type for friendlies
        }

        ::next_target::
    end

    -- AWACS bonus: if friendly AWACS is airborne, extend detection to whole map for hostiles in AWACS range
    for aeid, target in pairs(aircraftPositions) do
        if target.role == 'awacs' and target.faction == myFaction and aeid ~= playerAeid then
            local awacsRange = getRadarRange(aeid)
            local awacsPos = target.pos

            for targetAeid, hostileTarget in pairs(aircraftPositions) do
                if targetAeid ~= playerAeid and not contacts[targetAeid] then
                    if hostileTarget.faction ~= myFaction and hostileTarget.pos then
                        local dist = #(awacsPos - hostileTarget.pos)
                        if dist <= awacsRange then
                            contacts[targetAeid] = {
                                aeid      = targetAeid,
                                pos       = hostileTarget.pos,
                                velocity  = hostileTarget.velocity,
                                heading   = hostileTarget.heading,
                                speed     = hostileTarget.speed,
                                altitude  = hostileTarget.altitude,
                                distance  = #(myPos - hostileTarget.pos),
                                bearing   = 0,
                                iff       = 'hostile',
                                type      = hostileTarget.role or 'unknown',
                                source    = 'awacs',
                            }
                        end
                    end
                end
            end
        end
    end

    return contacts
end

-- ============================================================
-- LOCK-ON SYSTEM
-- ============================================================

--- Request lock on a target
---@param attackerAwid string
---@param targetAeid string
---@param weaponType string 'aim_ir' | 'aim_radar'
---@return number|nil lockId
---@return string|nil error
function TargetingManager.RequestLock(attackerAwid, targetAeid, weaponType)
    -- Find attacker's aircraft
    local attackerAeid = nil
    for aeid, data in pairs(aircraftPositions) do
        if data.owner_awid == attackerAwid then
            attackerAeid = aeid
            break
        end
    end
    if not attackerAeid then return nil, 'No aircraft' end

    -- Check target exists and is visible
    local contacts = playerContacts[attackerAwid]
    if not contacts or not contacts[targetAeid] then
        return nil, 'Target not visible'
    end

    local contact = contacts[targetAeid]

    -- Check lock cone (narrower than radar)
    local lockCone = DEFAULT_LOCK_CONE
    if weaponType == 'aim_ir' then
        lockCone = 60 -- IR has wider acquisition cone
    end

    local myAircraft = aircraftPositions[attackerAeid]
    if myAircraft then
        local toTarget = contact.pos - myAircraft.pos
        local angleToTarget = math.deg(math.atan2(toTarget.x, toTarget.y))
        if angleToTarget < 0 then angleToTarget = angleToTarget + 360 end
        local angleDiff = math.abs(angleToTarget - (myAircraft.heading or 0))
        if angleDiff > 180 then angleDiff = 360 - angleDiff end

        if angleDiff > lockCone / 2 then
            return nil, 'Outside lock cone'
        end
    end

    -- Create lock
    local lockId = nextLockId
    nextLockId = nextLockId + 1

    activeLocks[lockId] = {
        id            = lockId,
        attacker_awid = attackerAwid,
        attacker_aeid = attackerAeid,
        target_aeid   = targetAeid,
        weapon_type   = weaponType,
        state         = LOCK_STATE.LOCKING,
        progress      = 0,
        lock_time     = weaponType == 'aim_ir' and 2.0 or 3.5, -- seconds to achieve lock
        started_at    = GetGameTimer(),
    }

    -- RWR: warn the target
    local targetData = aircraftPositions[targetAeid]
    if targetData and targetData.source then
        TriggerClientEvent('aw:targeting:rwr_warning', targetData.source, {
            type        = weaponType,
            direction   = myAircraft and myAircraft.heading or 0,
            lock_state  = 'locking',
        })
    end

    TriggerEvent(AW.EVENT.LOCK_INITIATED, {
        attacker_awid = attackerAwid,
        target_aeid   = targetAeid,
        weapon_type   = weaponType,
        lock_id       = lockId,
    })

    return lockId, nil
end

--- Break a lock
---@param lockId number
function TargetingManager.BreakLock(lockId)
    local lock = activeLocks[lockId]
    if not lock then return end

    lock.state = LOCK_STATE.BROKEN
    activeLocks[lockId] = nil

    TriggerEvent(AW.EVENT.LOCK_BROKEN, {
        lock_id       = lockId,
        attacker_awid = lock.attacker_awid,
        target_aeid   = lock.target_aeid,
    })
end

--- Get lock state
---@param lockId number
---@return table|nil
function TargetingManager.GetLockState(lockId)
    return activeLocks[lockId]
end

--- Get contacts for a player
---@param awid string
---@return table
function TargetingManager.GetContacts(awid)
    return playerContacts[awid] or {}
end

--- Get radar range for a player's aircraft
---@param awid string
---@return number
function TargetingManager.GetPlayerRadarRange(awid)
    for aeid, data in pairs(aircraftPositions) do
        if data.owner_awid == awid then
            return getRadarRange(aeid)
        end
    end
    return 0
end

-- ============================================================
-- LOCK PROGRESSION TICK
-- ============================================================

local function tickLocks()
    local now = GetGameTimer()

    for lockId, lock in pairs(activeLocks) do
        if lock.state == LOCK_STATE.LOCKING then
            local elapsed = (now - lock.started_at) / 1000
            lock.progress = math.min(1.0, elapsed / lock.lock_time)

            -- Check if target still in cone
            local attackerAircraft = aircraftPositions[lock.attacker_aeid]
            local targetAircraft = aircraftPositions[lock.target_aeid]

            if not attackerAircraft or not targetAircraft then
                TargetingManager.BreakLock(lockId)
                goto next_lock
            end

            -- Check target still in range and cone
            local dist = #(attackerAircraft.pos - targetAircraft.pos)
            local radarRange = getRadarRange(lock.attacker_aeid)
            if dist > radarRange then
                TargetingManager.BreakLock(lockId)
                goto next_lock
            end

            -- Lock achieved
            if lock.progress >= 1.0 then
                lock.state = LOCK_STATE.LOCKED

                -- Notify attacker
                local attackerSource = attackerAircraft.source
                if attackerSource then
                    TriggerClientEvent('aw:targeting:lock_achieved', attackerSource, {
                        lock_id     = lockId,
                        target_aeid = lock.target_aeid,
                    })
                end

                -- RWR: upgrade warning to locked
                if targetAircraft.source then
                    TriggerClientEvent('aw:targeting:rwr_warning', targetAircraft.source, {
                        type       = lock.weapon_type,
                        lock_state = 'locked',
                    })
                end

                TriggerEvent(AW.EVENT.LOCK_ACQUIRED, {
                    lock_id       = lockId,
                    attacker_awid = lock.attacker_awid,
                    target_aeid   = lock.target_aeid,
                    weapon_type   = lock.weapon_type,
                })
            end
        end

        ::next_lock::
    end
end

-- ============================================================
-- RADAR PUSH TICK
-- ============================================================

--- Push contacts to all active players
local function tickRadarPush()
    for aeid, data in pairs(aircraftPositions) do
        if data.owner_awid and data.source then
            local contacts = computeContacts(data.owner_awid, aeid)
            playerContacts[data.owner_awid] = contacts

            -- Serialize contacts for client
            local contactList = {}
            for _, contact in pairs(contacts) do
                contactList[#contactList + 1] = contact
            end

            TriggerClientEvent('aw:targeting:contacts_update', data.source, contactList)
        end
    end
end

-- ============================================================
-- EVENT HANDLERS
-- ============================================================

--- Aircraft spawned — register in tracking system
AddEventHandler(AW.EVENT.AIRCRAFT_SPAWNED, function(data)
    if data and data.aeid then
        registerAircraft(data.aeid, data)
    end
end)

--- Aircraft destroyed / despawned — unregister
AddEventHandler(AW.EVENT.AIRCRAFT_DESTROYED, function(data)
    if data and data.aeid then
        unregisterAircraft(data.aeid)
    end
end)

AddEventHandler(AW.EVENT.AIRCRAFT_DESPAWNED, function(data)
    if data and data.aeid then
        unregisterAircraft(data.aeid)
    end
end)

--- Flight state update — update position tracking
RegisterNetEvent('aw:aircraft:flight_state')
AddEventHandler('aw:aircraft:flight_state', function(data)
    if not data or not data.aeid then return end
    updatePosition(data.aeid, data)
end)

--- Player dropped — cleanup
AddEventHandler(AW.EVENT.PLAYER_DROPPED, function(data)
    if data and data.awid then
        playerContacts[data.awid] = nil
    end
end)

-- ============================================================
-- PERIODIC TASKS
-- ============================================================

-- Radar push: every 250ms (4 Hz)
CreateThread(function()
    while true do
        Wait(250)
        if initialized then
            tickRadarPush()
        end
    end
end)

-- Lock progression: every 100ms
CreateThread(function()
    while true do
        Wait(100)
        if initialized then
            tickLocks()
        end
    end
end)

-- Stale aircraft cleanup: every 5s
CreateThread(function()
    while true do
        Wait(5000)
        if initialized then
            local now = GetGameTimer()
            for aeid, data in pairs(aircraftPositions) do
                if now - (data.last_update or 0) > 30000 then -- 30s stale
                    unregisterAircraft(aeid)
                end
            end
        end
    end
end)

-- ============================================================
-- INITIALIZATION
-- ============================================================

AddEventHandler(AW.EVENT.CORE_READY, function()
    if initialized then return end
    initialized = true

    if CoreAPI and CoreAPI.RegisterModule then
        CoreAPI.RegisterModule({
            name     = 'aw-targeting',
            version  = '1.0.0',
            priority = 400,
        })
    end

    CoreLogger.Info('aw-targeting', 'Targeting & radar module initialized')
end)

-- ============================================================
-- EXPORTS
-- ============================================================

exports('GetContacts',         function(...) return TargetingManager.GetContacts(...) end)
exports('RequestLock',         function(...) return TargetingManager.RequestLock(...) end)
exports('BreakLock',           function(...) return TargetingManager.BreakLock(...) end)
exports('GetLockState',        function(...) return TargetingManager.GetLockState(...) end)
exports('GetPlayerRadarRange', function(...) return TargetingManager.GetPlayerRadarRange(...) end)
