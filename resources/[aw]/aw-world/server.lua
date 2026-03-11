--[[
    aw-world — Server-side World Management
    
    Responsibilities:
    1. Load zones and bases from config
    2. Track zone ownership per faction
    3. Zone capture mechanics (presence-based)
    4. Base operational status (intact + supplied)
    5. Supply line computation
    6. Weather system — server-controlled, affects gameplay
    7. Persist zone state across restarts
]]

-- ============================================================
-- MODULE STATE
-- ============================================================

local WorldManager = {}
local initialized = false

-- Zone runtime state: zoneId → { ... }
local zones = {}

-- Base runtime state: baseId → { ... }
local bases = {}

-- Weather state
local weather = {
    current  = 'CLEAR',          -- CLEAR, OVERCAST, RAIN, STORM, FOG
    wind     = { speed = 5, direction = 180 },
    time     = { hour = 12, minute = 0 },
}

-- Zone capture state: zoneId → { faction → presence_ticks }
local captureProgress = {}

-- Supply graph cache
local supplyGraph = {}

-- Config references
local zoneDefs = {}
local baseDefs = {}

-- ============================================================
-- ZONE MANAGEMENT
-- ============================================================

--- Initialize zones from config
local function initZones()
    if CoreRegistry then
        local allZones = CoreRegistry.GetAll('zone')
        if allZones then
            for id, def in pairs(allZones) do
                zoneDefs[id] = def
                zones[id] = {
                    id          = id,
                    display     = def.display or id,
                    type        = def.type or 'territory',
                    center      = def.center or vector3(0, 0, 0),
                    radius      = def.radius or 1000.0,
                    owner       = def.default_owner or nil,
                    contested   = false,
                    capture_pct = 0.0,
                    has_radar   = def.has_radar or false,
                    has_aa      = def.has_aa or false,
                }
                captureProgress[id] = {}
            end
        end
    end
end

--- Initialize bases from config
local function initBases()
    if CoreRegistry then
        local allBases = CoreRegistry.GetAll('base')
        if not allBases then
            -- Try zone-embedded bases
            for zoneId, def in pairs(zoneDefs) do
                if def.base then
                    baseDefs[zoneId] = def.base
                    bases[zoneId] = {
                        id          = zoneId,
                        display     = def.base.display or def.display,
                        zone_id     = zoneId,
                        position    = def.base.position or def.center or vector3(0, 0, 0),
                        heading     = def.base.heading or 0,
                        faction     = zones[zoneId] and zones[zoneId].owner or nil,
                        intact      = true,
                        health      = 100,
                        supplied    = true,
                        runways     = def.base.runways or 1,
                    }
                end
            end
        else
            for id, def in pairs(allBases) do
                baseDefs[id] = def
                bases[id] = {
                    id          = id,
                    display     = def.display or id,
                    zone_id     = def.zone_id or id,
                    position    = def.position or vector3(0, 0, 0),
                    heading     = def.heading or 0,
                    faction     = def.default_faction or nil,
                    intact      = true,
                    health      = 100,
                    supplied    = true,
                    runways     = def.runways or 1,
                }
            end
        end
    end
end

--- Load persisted zone ownership from DB
local function loadZoneState()
    if not MySQL then return end

    local rows = MySQL.Sync.fetchAll(
        'SELECT zone_id, owner_faction, health FROM ' .. AW.TABLE.WORLD_STATE,
        {}
    )

    if rows then
        for _, row in ipairs(rows) do
            if zones[row.zone_id] then
                zones[row.zone_id].owner = row.owner_faction
            end
            -- Also update associated base faction
            if bases[row.zone_id] then
                bases[row.zone_id].faction = row.owner_faction
                if row.health then
                    bases[row.zone_id].health = row.health
                    bases[row.zone_id].intact = row.health > 0
                end
            end
        end
    end
end

--- Save zone state to DB
local function saveZoneState()
    if not MySQL then return end

    for zoneId, zone in pairs(zones) do
        local baseHealth = bases[zoneId] and bases[zoneId].health or 100
        MySQL.Async.execute(
            'INSERT INTO ' .. AW.TABLE.WORLD_STATE .. ' (zone_id, owner_faction, health) VALUES (?, ?, ?) '
            .. 'ON DUPLICATE KEY UPDATE owner_faction = ?, health = ?',
            { zoneId, zone.owner, baseHealth, zone.owner, baseHealth }
        )
    end
end

-- ============================================================
-- ZONE QUERY API
-- ============================================================

--- Get a zone's runtime state
---@param zoneId string
---@return table|nil
function WorldManager.GetZone(zoneId)
    return zones[zoneId]
end

--- Get all zones
---@return table zoneId → state
function WorldManager.GetAllZones()
    return zones
end

--- Get zone owner faction
---@param zoneId string
---@return string|nil factionId
function WorldManager.GetZoneOwner(zoneId)
    if zones[zoneId] then
        return zones[zoneId].owner
    end
    return nil
end

-- ============================================================
-- ZONE CAPTURE
-- ============================================================

--- Process zone capture by a faction
---@param zoneId string
---@param factionId string
---@param force boolean|nil Force capture (admin)
---@return boolean success
function WorldManager.CaptureZone(zoneId, factionId, force)
    local zone = zones[zoneId]
    if not zone then return false end

    if zone.owner == factionId and not force then
        return false -- Already owned
    end

    local previousOwner = zone.owner
    zone.owner = factionId
    zone.contested = false
    zone.capture_pct = 100.0

    -- Update associated base
    if bases[zoneId] then
        bases[zoneId].faction = factionId
    end

    -- Recalculate supply lines
    WorldManager.RecalculateSupply()

    -- Persist
    saveZoneState()

    -- Emit events
    TriggerEvent(AW.EVENT.ZONE_CAPTURED, {
        zone_id        = zoneId,
        faction        = factionId,
        previous_owner = previousOwner,
        display        = zone.display,
    })

    if previousOwner then
        TriggerEvent(AW.EVENT.ZONE_LOST, {
            zone_id        = zoneId,
            faction        = previousOwner,
            captured_by    = factionId,
        })
    end

    CoreLogger.Info('aw-world', 'Zone %s captured by %s (was: %s)', zoneId, factionId, previousOwner or 'neutral')

    -- Sync to all clients
    TriggerClientEvent(AW.EVENT.ZONE_CAPTURED, -1, {
        zone_id  = zoneId,
        faction  = factionId,
        display  = zone.display,
    })

    return true
end

-- ============================================================
-- ZONE PRESENCE TICK
-- ============================================================

--- Count aircraft per faction in each zone
local function tickZonePresence()
    -- Reset presence counters
    for zoneId, _ in pairs(captureProgress) do
        captureProgress[zoneId] = {}
    end

    -- Get all active aircraft and tally per zone
    local players = GetPlayers()
    for _, playerId in ipairs(players) do
        local ped = GetPlayerPed(playerId)
        if ped and ped ~= 0 then
            local veh = GetVehiclePedIsIn(ped, false)
            if veh and veh ~= 0 then
                local pos = GetEntityCoords(veh)
                local awid = nil

                -- Get player's AWID from state or identity
                if CoreIdentity then
                    awid = CoreIdentity.GetAWID(tonumber(playerId))
                end

                local factionId = nil
                if awid then
                    factionId = exports['aw-faction']:GetFaction(awid)
                end

                if factionId then
                    -- Check which zone they're in
                    for zoneId, zone in pairs(zones) do
                        local dist = #(pos - zone.center)
                        if dist <= zone.radius then
                            if not captureProgress[zoneId][factionId] then
                                captureProgress[zoneId][factionId] = 0
                            end
                            captureProgress[zoneId][factionId] = captureProgress[zoneId][factionId] + 1
                        end
                    end
                end
            end
        end
    end

    -- Process capture progress
    for zoneId, factionPresence in pairs(captureProgress) do
        local zone = zones[zoneId]
        if not zone then goto next_zone end

        local dominantFaction = nil
        local dominantCount = 0
        local contested = false

        for fId, count in pairs(factionPresence) do
            if count > dominantCount then
                dominantFaction = fId
                dominantCount = count
                contested = false
            elseif count == dominantCount and count > 0 then
                contested = true
            end
        end

        zone.contested = contested

        if dominantFaction and not contested and dominantFaction ~= zone.owner then
            -- Progress towards capture: 2% per tick per aircraft
            zone.capture_pct = (zone.capture_pct or 0) + (dominantCount * 2)
            if zone.capture_pct >= 100 then
                WorldManager.CaptureZone(zoneId, dominantFaction)
            end
        elseif dominantFaction == zone.owner or not dominantFaction then
            -- Decay capture progress if owner is present or zone is empty
            zone.capture_pct = math.max(0, (zone.capture_pct or 0) - 5)
        end

        ::next_zone::
    end
end

-- ============================================================
-- BASE MANAGEMENT
-- ============================================================

--- Get a base's runtime state
---@param baseId string
---@return table|nil
function WorldManager.GetBase(baseId)
    return bases[baseId]
end

--- Get all bases
---@return table
function WorldManager.GetAllBases()
    return bases
end

--- Is a base operational (intact AND supplied)?
---@param baseId string
---@return boolean
function WorldManager.IsBaseOperational(baseId)
    local base = bases[baseId]
    if not base then return false end
    return base.intact and base.supplied
end

--- Damage a base
---@param baseId string
---@param amount number
function WorldManager.DamageBase(baseId, amount)
    local base = bases[baseId]
    if not base then return end

    base.health = math.max(0, base.health - amount)
    if base.health <= 0 then
        base.intact = false

        TriggerEvent(AW.EVENT.BASE_DESTROYED, {
            base_id  = baseId,
            zone_id  = base.zone_id,
            faction  = base.faction,
        })

        CoreLogger.Info('aw-world', 'Base %s destroyed', baseId)
    end
end

--- Repair a base
---@param baseId string
---@param amount number
function WorldManager.RepairBase(baseId, amount)
    local base = bases[baseId]
    if not base then return end

    base.health = math.min(100, base.health + amount)
    if base.health > 0 and not base.intact then
        base.intact = true

        TriggerEvent(AW.EVENT.BASE_REPAIRED, {
            base_id = baseId,
            zone_id = base.zone_id,
            faction = base.faction,
        })
    end
end

-- ============================================================
-- SUPPLY SYSTEM
-- ============================================================

--- Recalculate supply connectivity for all bases
function WorldManager.RecalculateSupply()
    -- Each faction has origin zones (defined in config or first zone)
    -- Bases are supplied if there's an unbroken chain of friendly zones to an origin

    for _, base in pairs(bases) do
        local faction = base.faction
        if not faction then
            base.supplied = false
            goto next_base
        end

        -- Simple supply check: base is supplied if its zone is owned by its faction
        -- More complex graph-based supply is computed here
        local zoneOwner = zones[base.zone_id] and zones[base.zone_id].owner
        if zoneOwner == faction then
            local wasSupplied = base.supplied
            base.supplied = true
            if not wasSupplied then
                TriggerEvent(AW.EVENT.SUPPLY_CONNECTED, {
                    base_id = base.id,
                    faction = faction,
                })
            end
        else
            local wasSupplied = base.supplied
            base.supplied = false
            if wasSupplied then
                TriggerEvent(AW.EVENT.SUPPLY_DISCONNECTED, {
                    base_id = base.id,
                    faction = faction,
                })
            end
        end

        ::next_base::
    end
end

--- Get supply status for a base
---@param baseId string
---@return boolean
function WorldManager.GetSupplyStatus(baseId)
    local base = bases[baseId]
    if not base then return false end
    return base.supplied
end

-- ============================================================
-- WEATHER SYSTEM
-- ============================================================

local WEATHER_TYPES = {
    'CLEAR', 'EXTRASUNNY', 'CLOUDS', 'OVERCAST',
    'RAIN', 'CLEARING', 'THUNDER', 'SMOG',
    'FOGGY', 'XMAS', 'SNOWLIGHT', 'BLIZZARD',
}

--- Get current weather
---@return table
function WorldManager.GetWeather()
    return weather
end

--- Set weather (admin or scheduled)
---@param weatherType string
---@param transition boolean|nil Gradual transition
function WorldManager.SetWeather(weatherType, transition)
    weather.current = weatherType

    TriggerEvent(AW.EVENT.WEATHER_CHANGED, {
        weather    = weatherType,
        wind       = weather.wind,
        transition = transition or false,
    })

    -- Sync to all clients
    TriggerClientEvent('aw:world:weather_sync', -1, weather)

    CoreLogger.Info('aw-world', 'Weather changed to %s', weatherType)
end

-- ============================================================
-- TIME MANAGEMENT
-- ============================================================

--- Advance server time (called periodically)
local function tickTime()
    weather.time.minute = weather.time.minute + 1
    if weather.time.minute >= 60 then
        weather.time.minute = 0
        weather.time.hour = (weather.time.hour + 1) % 24
    end
end

-- ============================================================
-- EVENT HANDLERS
-- ============================================================

--- War reset — reset zones to defaults
AddEventHandler(AW.EVENT.WAR_RESET, function()
    for zoneId, def in pairs(zoneDefs) do
        if zones[zoneId] then
            zones[zoneId].owner = def.default_owner or nil
            zones[zoneId].contested = false
            zones[zoneId].capture_pct = 0
        end
        if bases[zoneId] then
            bases[zoneId].faction = def.default_owner or nil
            bases[zoneId].intact = true
            bases[zoneId].health = 100
            bases[zoneId].supplied = true
        end
    end
    saveZoneState()
    WorldManager.RecalculateSupply()
    CoreLogger.Info('aw-world', 'World state reset')
end)

--- Player loaded — sync world state
AddEventHandler(AW.EVENT.PLAYER_LOADED, function(data)
    if data and data.source then
        TriggerClientEvent('aw:world:state_sync', data.source, {
            zones   = zones,
            bases   = bases,
            weather = weather,
        })
    end
end)

--- Core shutdown — save all state
AddEventHandler(AW.EVENT.CORE_SHUTDOWN, function()
    saveZoneState()
end)

-- ============================================================
-- PERIODIC TASKS
-- ============================================================

-- Zone presence check every 5 seconds
CreateThread(function()
    while true do
        Wait(5000)
        if initialized then
            tickZonePresence()
        end
    end
end)

-- Time advancement every 2 seconds (≈1 game minute)
CreateThread(function()
    while true do
        Wait(2000)
        if initialized then
            tickTime()
        end
    end
end)

-- Save zone state every 60 seconds
CreateThread(function()
    while true do
        Wait(60000)
        if initialized then
            saveZoneState()
        end
    end
end)

-- Weather change — random weather every 10-20 minutes
CreateThread(function()
    while true do
        Wait(math.random(600000, 1200000))
        if initialized then
            local newWeather = WEATHER_TYPES[math.random(#WEATHER_TYPES)]
            WorldManager.SetWeather(newWeather, true)
        end
    end
end)

-- ============================================================
-- INITIALIZATION
-- ============================================================

AddEventHandler(AW.EVENT.CORE_READY, function()
    if initialized then return end
    initialized = true

    initZones()
    initBases()
    loadZoneState()
    WorldManager.RecalculateSupply()

    if CoreAPI and CoreAPI.RegisterModule then
        CoreAPI.RegisterModule({
            name     = 'aw-world',
            version  = '1.0.0',
            priority = 300,
        })
    end

    CoreLogger.Info('aw-world', 'World module initialized — %d zones, %d bases', Utils.TableCount(zones), Utils.TableCount(bases))
end)

-- ============================================================
-- EXPORTS
-- ============================================================

exports('GetZone',             function(...) return WorldManager.GetZone(...) end)
exports('GetAllZones',         function(...) return WorldManager.GetAllZones(...) end)
exports('GetZoneOwner',        function(...) return WorldManager.GetZoneOwner(...) end)
exports('CaptureZone',         function(...) return WorldManager.CaptureZone(...) end)
exports('GetBase',             function(...) return WorldManager.GetBase(...) end)
exports('GetAllBases',         function(...) return WorldManager.GetAllBases(...) end)
exports('IsBaseOperational',   function(...) return WorldManager.IsBaseOperational(...) end)
exports('GetWeather',          function(...) return WorldManager.GetWeather(...) end)
exports('SetWeather',          function(...) return WorldManager.SetWeather(...) end)
exports('GetSupplyStatus',     function(...) return WorldManager.GetSupplyStatus(...) end)
