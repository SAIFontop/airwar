--[[
    aw-aircraft — Server-side Aircraft Management
    
    Responsibilities:
    1. Aircraft spawning / despawning with server authority
    2. Ownership system (persistent via DB)
    3. Fuel management (consumption by flight state)
    4. Damage zones (8 zones per aircraft)
    5. Runtime aircraft registry (AEID → aircraft data)
    6. StateBag replication for client consumption
    7. Mass calculation (base + fuel + loadout)
]]

-- ============================================================
-- MODULE STATE
-- ============================================================

local AircraftManager = {}
local initialized = false

-- Active aircraft: AEID → aircraft runtime data
local activeAircraft = {}

-- Player → AEID mapping (which aircraft is each player flying)
local playerAircraft = {} -- awid → aeid

-- Ownership cache: awid → { [aircraftTypeId] = true }
local ownershipCache = {}

-- Config shorthand
local serverConfig = nil
local aircraftTypes = nil

-- ============================================================
-- HELPERS
-- ============================================================

--- Generate a unique Aircraft Entity ID
---@return string AEID
local function generateAEID()
    return AW.PREFIX.ENTITY .. Utils.RandomHex(8)
end

--- Get aircraft type config from registry
---@param typeId string Aircraft type ID
---@return table|nil Aircraft type definition
local function getAircraftType(typeId)
    if CoreRegistry then
        return CoreRegistry.Get('aircraft', typeId)
    end
    return nil
end

--- Calculate initial health zones (all at 100%)
---@return table Health zones
local function createHealthZones()
    local zones = {}
    for _, zone in pairs(AW.DAMAGE_ZONE) do
        zones[zone] = 100.0
    end
    return zones
end

--- Calculate total mass (base + fuel weight + loadout weight)
---@param aircraft table Active aircraft data
---@return number Total mass in kg
local function calculateMass(aircraft)
    local typeDef = getAircraftType(aircraft.type_id)
    if not typeDef then return 10000 end

    local baseMass = typeDef.mass or 10000
    local fuelMass = (aircraft.fuel / 100.0) * (typeDef.fuel_capacity or 5000) * 0.8 -- Jet fuel ~0.8 kg/L
    local loadoutMass = aircraft.loadout_mass or 0

    return baseMass + fuelMass + loadoutMass
end

--- Get fuel consumption rate based on flight state
---@param aircraft table Active aircraft data
---@return number Fuel consumed per tick (%)
local function getFuelRate(aircraft)
    if not serverConfig then return 0.01 end

    local rates = serverConfig.fuel_rates or { idle = 0.005, cruise = 0.02, combat = 0.05, afterburner = 0.15 }
    local state = aircraft.flight_state or 'idle'

    return rates[state] or rates.cruise
end

-- ============================================================
-- OWNERSHIP SYSTEM
-- ============================================================

--- Load ownership for a player from DB
---@param awid string Player AWID
local function loadOwnership(awid)
    if ownershipCache[awid] then return end

    ownershipCache[awid] = {}

    if not MySQL then return end

    local rows = MySQL.Sync.fetchAll(
        'SELECT aircraft_type FROM ' .. AW.TABLE.OWNERSHIP .. ' WHERE awid = ?',
        { awid }
    )

    if rows then
        for _, row in ipairs(rows) do
            ownershipCache[awid][row.aircraft_type] = true
        end
    end
end

--- Check if player owns an aircraft type
---@param awid string Player AWID
---@param typeId string Aircraft type ID
---@return boolean
function AircraftManager.IsOwned(awid, typeId)
    if not ownershipCache[awid] then
        loadOwnership(awid)
    end
    return ownershipCache[awid] and ownershipCache[awid][typeId] == true
end

--- Grant aircraft ownership to a player
---@param awid string Player AWID
---@param typeId string Aircraft type ID
---@return boolean success
function AircraftManager.GrantOwnership(awid, typeId)
    if not getAircraftType(typeId) then
        CoreLogger.Warn('aw-aircraft', 'GrantOwnership: unknown type %s', typeId)
        return false
    end

    if not ownershipCache[awid] then
        ownershipCache[awid] = {}
    end

    if ownershipCache[awid][typeId] then return true end -- Already owned

    ownershipCache[awid][typeId] = true

    if MySQL then
        MySQL.Async.execute(
            'INSERT IGNORE INTO ' .. AW.TABLE.OWNERSHIP .. ' (awid, aircraft_type, acquired_at) VALUES (?, ?, NOW())',
            { awid, typeId }
        )
    end

    CoreLogger.Info('aw-aircraft', 'Ownership granted: %s → %s', awid, typeId)
    return true
end

--- Revoke aircraft ownership
---@param awid string Player AWID
---@param typeId string Aircraft type ID
---@return boolean success
function AircraftManager.RevokeOwnership(awid, typeId)
    if ownershipCache[awid] then
        ownershipCache[awid][typeId] = nil
    end

    if MySQL then
        MySQL.Async.execute(
            'DELETE FROM ' .. AW.TABLE.OWNERSHIP .. ' WHERE awid = ? AND aircraft_type = ?',
            { awid, typeId }
        )
    end

    return true
end

--- Get all owned aircraft types for a player
---@param awid string Player AWID
---@return table Array of type IDs
function AircraftManager.GetOwnedAircraft(awid)
    if not ownershipCache[awid] then
        loadOwnership(awid)
    end

    local result = {}
    if ownershipCache[awid] then
        for typeId in pairs(ownershipCache[awid]) do
            result[#result + 1] = typeId
        end
    end
    return result
end

-- ============================================================
-- SPAWN / DESPAWN
-- ============================================================

--- Spawn an aircraft for a player
---@param source number Player server ID
---@param typeId string Aircraft type ID
---@param position vector3 Spawn position
---@param heading number Spawn heading
---@return string|nil AEID on success, nil on failure
---@return string|nil Error message
function AircraftManager.SpawnAircraft(source, typeId, position, heading)
    -- Validate player
    local awid = nil
    if CoreIdentity then
        local player = CoreIdentity.GetPlayer(source)
        if player then awid = player.awid end
    end
    if not awid then
        return nil, 'Player not initialized'
    end

    -- Check if player already has an active aircraft
    if playerAircraft[awid] then
        return nil, 'Player already has an active aircraft'
    end

    -- Validate aircraft type exists
    local typeDef = getAircraftType(typeId)
    if not typeDef then
        return nil, 'Unknown aircraft type: ' .. typeId
    end

    -- Check ownership (tier 1 free aircraft skip ownership check)
    if (typeDef.tier or 1) > 1 and not AircraftManager.IsOwned(awid, typeId) then
        return nil, 'Player does not own this aircraft'
    end

    -- Check max active aircraft limit
    local activeCount = 0
    for _ in pairs(activeAircraft) do activeCount = activeCount + 1 end
    if activeCount >= AW.MAX_AIRCRAFT then
        return nil, 'Server aircraft limit reached'
    end

    -- Create the entity server-side
    local modelHash = typeDef.model
    if type(modelHash) == 'string' then
        modelHash = GetHashKey(typeDef.model)
    end

    local entityId = CreateVehicleServerSetter(modelHash, 'automobile', position.x, position.y, position.z, heading)
    if not entityId or entityId == 0 then
        return nil, 'Failed to create vehicle entity'
    end

    -- Wait for entity to exist (max 5 seconds)
    local timeout = 50
    while not DoesEntityExist(entityId) and timeout > 0 do
        Wait(100)
        timeout = timeout - 1
    end

    if not DoesEntityExist(entityId) then
        return nil, 'Entity creation timed out'
    end

    -- Generate AEID
    local aeid = generateAEID()

    -- Build runtime aircraft data
    local aircraft = {
        aeid          = aeid,
        entity_id     = entityId,
        net_id        = NetworkGetNetworkIdFromEntity(entityId),
        type_id       = typeId,
        owner_awid    = awid,
        owner_source  = source,
        faction       = nil, -- Set by faction module
        fuel          = 100.0,
        health_zones  = createHealthZones(),
        flight_state  = 'idle',
        spawned_at    = os.time(),
        loadout_mass  = 0,
        total_mass    = calculateMass({ type_id = typeId, fuel = 100.0, loadout_mass = 0 }),
        is_airborne   = false,
        speed         = 0.0,
        altitude      = 0.0,
        heading       = heading,
    }

    -- Register in active tracking
    activeAircraft[aeid] = aircraft
    playerAircraft[awid] = aeid

    -- Set StateBags for client replication
    local entity = entityId
    Entity(entity).state:set(AW.STATEBAG_PREFIX .. 'aeid', aeid, true)
    Entity(entity).state:set(AW.STATEBAG_PREFIX .. 'type', typeId, true)
    Entity(entity).state:set(AW.STATEBAG_PREFIX .. 'owner', awid, true)
    Entity(entity).state:set(AW.STATEBAG_PREFIX .. 'fuel', 100.0, true)
    Entity(entity).state:set(AW.STATEBAG_PREFIX .. 'health', json.encode(aircraft.health_zones), true)
    Entity(entity).state:set(AW.STATEBAG_PREFIX .. 'role', typeDef.role or 'fighter', true)

    -- Notify client to enter vehicle
    TriggerClientEvent(AW.EVENT.AIRCRAFT_SPAWNED, source, {
        aeid     = aeid,
        net_id   = aircraft.net_id,
        type_id  = typeId,
        role     = typeDef.role,
        display  = typeDef.display,
    })

    -- Broadcast to all (without source-specific data)
    TriggerEvent(AW.EVENT.AIRCRAFT_SPAWNED, {
        aeid     = aeid,
        type_id  = typeId,
        owner_awid = awid,
        role     = typeDef.role,
    })

    CoreLogger.Info('aw-aircraft', 'Spawned %s (%s) for %s [AEID: %s]', typeDef.display, typeId, awid, aeid)
    return aeid, nil
end

--- Despawn an aircraft by AEID
---@param aeid string Aircraft Entity ID
---@param reason string|nil Despawn reason
---@return boolean success
function AircraftManager.DespawnAircraft(aeid, reason)
    local aircraft = activeAircraft[aeid]
    if not aircraft then return false end

    reason = reason or 'despawn'

    -- Delete the entity
    if DoesEntityExist(aircraft.entity_id) then
        DeleteEntity(aircraft.entity_id)
    end

    -- Remove from tracking
    activeAircraft[aeid] = nil
    if playerAircraft[aircraft.owner_awid] == aeid then
        playerAircraft[aircraft.owner_awid] = nil
    end

    -- Broadcast despawn
    TriggerEvent(AW.EVENT.AIRCRAFT_DESPAWNED, {
        aeid       = aeid,
        type_id    = aircraft.type_id,
        owner_awid = aircraft.owner_awid,
        reason     = reason,
    })

    -- Notify owner client
    local playerSrc = aircraft.owner_source
    if playerSrc and GetPlayerName(playerSrc) then
        TriggerClientEvent(AW.EVENT.AIRCRAFT_DESPAWNED, playerSrc, {
            aeid   = aeid,
            reason = reason,
        })
    end

    CoreLogger.Info('aw-aircraft', 'Despawned %s [%s] reason: %s', aircraft.type_id, aeid, reason)
    return true
end

-- ============================================================
-- QUERY API
-- ============================================================

--- Get aircraft runtime data by AEID
---@param aeid string
---@return table|nil
function AircraftManager.GetAircraft(aeid)
    return activeAircraft[aeid]
end

--- Get the AEID of a player's active aircraft
---@param awid string Player AWID
---@return string|nil AEID
function AircraftManager.GetPlayerAircraft(awid)
    return playerAircraft[awid]
end

--- Get all active aircraft
---@return table AEID → aircraft data
function AircraftManager.GetAllAircraft()
    return activeAircraft
end

-- ============================================================
-- DAMAGE SYSTEM
-- ============================================================

--- Apply damage to a specific zone of an aircraft
---@param aeid string Aircraft Entity ID
---@param zone string Damage zone (from AW.DAMAGE_ZONE)
---@param amount number Damage amount (0-100)
---@param source_awid string|nil Attacker AWID for attribution
---@return boolean success
function AircraftManager.DamageZone(aeid, zone, amount, source_awid)
    local aircraft = activeAircraft[aeid]
    if not aircraft then return false end

    if not aircraft.health_zones[zone] then return false end

    -- Apply damage (clamp to 0)
    local oldHealth = aircraft.health_zones[zone]
    aircraft.health_zones[zone] = math.max(0, oldHealth - amount)
    local newHealth = aircraft.health_zones[zone]

    -- Update StateBag
    if DoesEntityExist(aircraft.entity_id) then
        Entity(aircraft.entity_id).state:set(
            AW.STATEBAG_PREFIX .. 'health',
            json.encode(aircraft.health_zones),
            true
        )
    end

    -- Trigger damage event
    TriggerEvent(AW.EVENT.AIRCRAFT_DAMAGED, {
        aeid        = aeid,
        zone        = zone,
        damage      = amount,
        new_health  = newHealth,
        attacker    = source_awid,
        owner_awid  = aircraft.owner_awid,
        type_id     = aircraft.type_id,
    })

    -- Notify owner client
    TriggerClientEvent(AW.EVENT.AIRCRAFT_DAMAGED, aircraft.owner_source, {
        aeid       = aeid,
        zone       = zone,
        new_health = newHealth,
    })

    -- Check for destruction (fuselage at 0 = catastrophic failure)
    if zone == AW.DAMAGE_ZONE.FUSELAGE and newHealth <= 0 then
        AircraftManager.DestroyAircraft(aeid, source_awid)
    end

    -- Check for critical zone effects
    if zone == AW.DAMAGE_ZONE.FUEL_TANK and newHealth < 50 then
        aircraft.fuel_leak = true -- Fuel leak flag — processed in fuel tick
    end

    return true
end

--- Destroy an aircraft (total loss)
---@param aeid string Aircraft Entity ID
---@param killer_awid string|nil Killer AWID
function AircraftManager.DestroyAircraft(aeid, killer_awid)
    local aircraft = activeAircraft[aeid]
    if not aircraft then return end

    -- Trigger destruction events before cleanup
    TriggerEvent(AW.EVENT.AIRCRAFT_DESTROYED, {
        aeid          = aeid,
        type_id       = aircraft.type_id,
        owner_awid    = aircraft.owner_awid,
        killer_awid   = killer_awid,
        cause         = killer_awid and 'combat' or 'other',
        flight_time   = os.time() - aircraft.spawned_at,
    })

    -- Notify all clients for explosion/effect
    TriggerClientEvent(AW.EVENT.AIRCRAFT_DESTROYED, -1, {
        aeid    = aeid,
        net_id  = aircraft.net_id,
        type_id = aircraft.type_id,
    })

    -- Force explosion on entity
    if DoesEntityExist(aircraft.entity_id) then
        -- Set entity health to 0 to trigger GTA explosion
        SetEntityHealth(aircraft.entity_id, 0)
    end

    -- Clean up after a short delay (let explosion play)
    SetTimeout(3000, function()
        AircraftManager.DespawnAircraft(aeid, 'destroyed')
    end)
end

--- Repair an aircraft (at base)
---@param aeid string Aircraft Entity ID
---@param percent number Repair percentage (0-100, how much to restore)
---@return boolean success
function AircraftManager.RepairAircraft(aeid, percent)
    local aircraft = activeAircraft[aeid]
    if not aircraft then return false end

    for zone, health in pairs(aircraft.health_zones) do
        aircraft.health_zones[zone] = math.min(100, health + percent)
    end

    aircraft.fuel_leak = false

    -- Update StateBag
    if DoesEntityExist(aircraft.entity_id) then
        Entity(aircraft.entity_id).state:set(
            AW.STATEBAG_PREFIX .. 'health',
            json.encode(aircraft.health_zones),
            true
        )

        -- Also repair the GTA entity
        SetEntityHealth(aircraft.entity_id, GetEntityMaxHealth(aircraft.entity_id))
        SetVehicleFixed(aircraft.entity_id)
    end

    CoreLogger.Debug('aw-aircraft', 'Repaired %s [%s] by %d%%', aircraft.type_id, aeid, percent)
    return true
end

--- Refuel an aircraft (at base)
---@param aeid string Aircraft Entity ID
---@param percent number Fuel to add (0-100)
---@return boolean success
function AircraftManager.RefuelAircraft(aeid, percent)
    local aircraft = activeAircraft[aeid]
    if not aircraft then return false end

    aircraft.fuel = math.min(100, aircraft.fuel + percent)

    -- Update StateBag
    if DoesEntityExist(aircraft.entity_id) then
        Entity(aircraft.entity_id).state:set(AW.STATEBAG_PREFIX .. 'fuel', aircraft.fuel, true)
    end

    -- Recalculate mass
    aircraft.total_mass = calculateMass(aircraft)

    return true
end

-- ============================================================
-- FUEL TICK (runs every FUEL_TICK_INTERVAL)
-- ============================================================

local function fuelTick()
    for aeid, aircraft in pairs(activeAircraft) do
        if aircraft.fuel > 0 then
            -- Base consumption
            local consumption = getFuelRate(aircraft)

            -- Fuel leak penalty
            if aircraft.fuel_leak then
                local tankHealth = aircraft.health_zones[AW.DAMAGE_ZONE.FUEL_TANK] or 100
                local leakRate = (1 - tankHealth / 100) * 0.1 -- Up to 0.1%/tick extra
                consumption = consumption + leakRate
            end

            aircraft.fuel = math.max(0, aircraft.fuel - consumption)

            -- Update StateBag (throttled — only when change is noticeable)
            if math.floor(aircraft.fuel) ~= math.floor(aircraft.fuel + consumption) then
                if DoesEntityExist(aircraft.entity_id) then
                    Entity(aircraft.entity_id).state:set(AW.STATEBAG_PREFIX .. 'fuel', aircraft.fuel, true)
                end
            end

            -- Recalculate mass
            aircraft.total_mass = calculateMass(aircraft)

            -- Fuel warnings
            if aircraft.fuel <= 10 and aircraft.fuel > 0 then
                TriggerClientEvent('aw:aircraft:fuel_warning', aircraft.owner_source, {
                    aeid = aeid,
                    fuel = aircraft.fuel,
                    level = aircraft.fuel <= 5 and 'critical' or 'low',
                })
            end

            -- Fuel empty — engine out
            if aircraft.fuel <= 0 then
                aircraft.fuel = 0
                aircraft.flight_state = 'dead_stick'

                TriggerEvent(AW.EVENT.AIRCRAFT_DAMAGED, {
                    aeid       = aeid,
                    zone       = 'engine',
                    damage     = 0,
                    new_health = aircraft.health_zones[AW.DAMAGE_ZONE.ENGINE],
                    owner_awid = aircraft.owner_awid,
                    type_id    = aircraft.type_id,
                    cause      = 'fuel_empty',
                })

                TriggerClientEvent('aw:aircraft:fuel_empty', aircraft.owner_source, { aeid = aeid })
            end
        end
    end
end

-- ============================================================
-- FLIGHT STATE UPDATE (from client reports)
-- ============================================================

RegisterNetEvent('aw:aircraft:state_update', function(data)
    local source = source
    local awid = nil

    if CoreIdentity then
        local player = CoreIdentity.GetPlayer(source)
        if player then awid = player.awid end
    end
    if not awid then return end

    local aeid = playerAircraft[awid]
    if not aeid then return end

    local aircraft = activeAircraft[aeid]
    if not aircraft then return end

    -- Update volatile state from client report
    if data.speed then aircraft.speed = data.speed end
    if data.altitude then aircraft.altitude = data.altitude end
    if data.heading then aircraft.heading = data.heading end
    if data.is_airborne ~= nil then aircraft.is_airborne = data.is_airborne end

    -- Determine flight state from speed/altitude
    if not aircraft.is_airborne then
        aircraft.flight_state = 'idle'
    elseif data.afterburner then
        aircraft.flight_state = 'afterburner'
    elseif data.in_combat then
        aircraft.flight_state = 'combat'
    else
        aircraft.flight_state = 'cruise'
    end
end)

-- ============================================================
-- EVENT HANDLERS
-- ============================================================

--- Player loaded — load their ownership data
AddEventHandler(AW.EVENT.PLAYER_LOADED, function(data)
    if data and data.awid then
        loadOwnership(data.awid)
    end
end)

--- Player disconnected — despawn their aircraft
AddEventHandler(AW.EVENT.PLAYER_DROPPED, function(data)
    if not data or not data.awid then return end

    local aeid = playerAircraft[data.awid]
    if aeid then
        AircraftManager.DespawnAircraft(aeid, 'player_disconnected')
    end

    -- Clean ownership cache
    ownershipCache[data.awid] = nil
end)

--- Core shutdown — despawn all aircraft
AddEventHandler(AW.EVENT.CORE_SHUTDOWN, function()
    for aeid in pairs(activeAircraft) do
        AircraftManager.DespawnAircraft(aeid, 'server_shutdown')
    end
end)

-- ============================================================
-- INITIALIZATION
-- ============================================================

AddEventHandler(AW.EVENT.CORE_READY, function()
    if initialized then return end
    initialized = true

    -- Load server config
    local ok, cfg = pcall(function()
        return exports['aw-config']:GetConfig('server')
    end)
    if ok and cfg then
        serverConfig = cfg
    end

    -- Register module
    if CoreAPI and CoreAPI.RegisterModule then
        CoreAPI.RegisterModule({
            name     = 'aw-aircraft',
            version  = '1.0.0',
            priority = 100,
        })
    end

    CoreLogger.Info('aw-aircraft', 'Aircraft module initialized')
end)

-- ============================================================
-- PERIODIC TASKS
-- ============================================================

-- Fuel consumption tick
CreateThread(function()
    while true do
        Wait(AW.FUEL_TICK_INTERVAL)
        if initialized then
            fuelTick()
        end
    end
end)

-- Entity cleanup — remove orphaned aircraft (entity deleted by GTA but still tracked)
CreateThread(function()
    while true do
        Wait(10000) -- Every 10 seconds
        if initialized then
            for aeid, aircraft in pairs(activeAircraft) do
                if not DoesEntityExist(aircraft.entity_id) then
                    CoreLogger.Warn('aw-aircraft', 'Orphaned aircraft detected: %s [%s] — cleaning up', aircraft.type_id, aeid)
                    activeAircraft[aeid] = nil
                    if playerAircraft[aircraft.owner_awid] == aeid then
                        playerAircraft[aircraft.owner_awid] = nil
                    end
                end
            end
        end
    end
end)

-- ============================================================
-- EXPORTS
-- ============================================================

exports('SpawnAircraft',    function(...) return AircraftManager.SpawnAircraft(...) end)
exports('DespawnAircraft',  function(...) return AircraftManager.DespawnAircraft(...) end)
exports('GetAircraft',      function(...) return AircraftManager.GetAircraft(...) end)
exports('GetPlayerAircraft', function(...) return AircraftManager.GetPlayerAircraft(...) end)
exports('GetAllAircraft',   function(...) return AircraftManager.GetAllAircraft(...) end)
exports('IsOwned',          function(...) return AircraftManager.IsOwned(...) end)
exports('GrantOwnership',   function(...) return AircraftManager.GrantOwnership(...) end)
exports('RevokeOwnership',  function(...) return AircraftManager.RevokeOwnership(...) end)
exports('GetOwnedAircraft', function(...) return AircraftManager.GetOwnedAircraft(...) end)
exports('DamageZone',       function(...) return AircraftManager.DamageZone(...) end)
exports('RepairAircraft',   function(...) return AircraftManager.RepairAircraft(...) end)
exports('RefuelAircraft',   function(...) return AircraftManager.RefuelAircraft(...) end)
