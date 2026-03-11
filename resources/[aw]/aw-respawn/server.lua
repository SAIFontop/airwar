--[[
    aw-respawn — Server-side Respawn Management
    
    Responsibilities:
    1. Detect player death (aircraft destroyed)
    2. Apply respawn timer based on aircraft role/rarity
    3. Determine respawn base (nearest friendly intact + supplied)
    4. Notify client to enter spectate / aircraft selection
    5. Handle reselection and respawn execution
]]

-- ============================================================
-- MODULE STATE
-- ============================================================

local RespawnManager = {}
local initialized = false

-- Active respawn timers: awid → { started, duration, expired, base_id, selected_aircraft }
local respawnTimers = {}

-- Respawn time by role (seconds)
local RESPAWN_TIMES = {
    fighter          = 15,
    interceptor      = 15,
    multirole        = 20,
    attacker         = 25,
    strike           = 25,
    bomber           = 45,
    heavy_bomber     = 60,
    transport        = 30,
    awacs            = 60,
    tanker           = 45,
    recon            = 20,
    stealth          = 30,
    trainer          = 10,
}
local DEFAULT_RESPAWN_TIME = 15

-- ============================================================
-- RESPAWN TIMER LOGIC
-- ============================================================

--- Get respawn timer duration for an aircraft role
---@param role string
---@return number seconds
local function getRespawnDuration(role)
    return RESPAWN_TIMES[role] or DEFAULT_RESPAWN_TIME
end

--- Find nearest friendly base that is intact and supplied
---@param awid string
---@param deathPos vector3
---@return table|nil base { id, name, pos }
local function findRespawnBase(awid, deathPos)
    local faction = exports['aw-faction']:GetFaction(awid)
    if not faction then return nil end

    local zones = exports['aw-world']:GetAllZones()
    if not zones then return nil end

    local bestBase = nil
    local bestDist = math.huge

    for _, zone in pairs(zones) do
        -- Base must be owned by player's faction, operational, and supplied
        if zone.owner == faction and zone.base then
            local base = zone.base
            local isOperational = exports['aw-world']:IsBaseOperational(zone.id)
            local isSupplied    = exports['aw-world']:IsBaseSupplied(zone.id)

            if isOperational and isSupplied and base.pos then
                local dist = deathPos and #(deathPos - base.pos) or math.huge
                if dist < bestDist then
                    bestDist = dist
                    bestBase = {
                        id   = zone.id,
                        name = zone.display or zone.id,
                        pos  = base.pos,
                    }
                end
            end
        end
    end

    return bestBase
end

--- Start respawn timer for a player
---@param awid string
---@param source number
---@param deathData table
local function startRespawnTimer(awid, source, deathData)
    local role = deathData.role or 'fighter'
    local duration = getRespawnDuration(role)
    local deathPos = deathData.position or vector3(0, 0, 0)

    local base = findRespawnBase(awid, deathPos)

    respawnTimers[awid] = {
        started            = GetGameTimer(),
        duration           = duration * 1000, -- ms
        expired            = false,
        base               = base,
        source             = source,
        death_pos          = deathPos,
        selected_aircraft  = nil,
        death_data         = deathData,
    }

    -- Emit event
    TriggerEvent(AW.EVENT.RESPAWN_TIMER_STARTED, {
        awid     = awid,
        duration = duration,
        base     = base,
    })

    -- Notify client to enter spectate mode
    TriggerClientEvent('aw:respawn:enter_spectate', source, {
        duration = duration,
        base     = base,
        killer   = deathData.killer_awid,
    })

    CoreLogger.Info('aw-respawn', ('Respawn timer started for %s — %ds (role: %s)'):format(awid, duration, role))
end

--- Check if timer has expired and process respawn
local function tickTimers()
    local now = GetGameTimer()

    for awid, timer in pairs(respawnTimers) do
        if not timer.expired and (now - timer.started) >= timer.duration then
            timer.expired = true

            -- Notify client that timer is up — show aircraft selection
            if timer.source then
                TriggerClientEvent('aw:respawn:timer_expired', timer.source, {
                    base = timer.base,
                })
            end
        end
    end
end

-- ============================================================
-- AIRCRAFT RESELECTION & RESPAWN
-- ============================================================

--- Client requests respawn with selected aircraft
RegisterNetEvent('aw:respawn:request_spawn')
AddEventHandler('aw:respawn:request_spawn', function(data)
    local source = source
    local awid = CoreIdentity and CoreIdentity.GetAWID(source)
    if not awid then return end

    local timer = respawnTimers[awid]
    if not timer then return end
    if not timer.expired then return end -- Timer hasn't finished yet

    local aircraftType = data and data.aircraft_type
    if not aircraftType then return end

    -- Verify player owns this aircraft (or it's a free default)
    local owned = true
    if exports['aw-store'] then
        owned = exports['aw-store']:GetOwnedItems(awid, 'aircraft')
        if owned then
            local hasAircraft = false
            for _, item in ipairs(owned) do
                if item.item_id == aircraftType then
                    hasAircraft = true
                    break
                end
            end
            -- Check if it's a free starter aircraft
            local def = CoreRegistry and CoreRegistry.Get('aircraft', aircraftType)
            if not hasAircraft and def and def.price and def.price > 0 then
                TriggerClientEvent('aw:respawn:error', source, 'You do not own this aircraft')
                return
            end
        end
    end

    -- Get respawn position from base
    local spawnPos = timer.base and timer.base.pos
    if not spawnPos then
        -- Fallback: find any available base
        local base = findRespawnBase(awid, timer.death_pos or vector3(0, 0, 0))
        if base then
            spawnPos = base.pos
        end
    end

    if not spawnPos then
        TriggerClientEvent('aw:respawn:error', source, 'No available base to respawn')
        return
    end

    -- Execute respawn
    local faction = exports['aw-faction']:GetFaction(awid)
    TriggerClientEvent('aw:respawn:execute', source, {
        aircraft_type = aircraftType,
        position      = spawnPos,
        heading       = 0,
        faction       = faction,
    })

    -- Cleanup timer
    respawnTimers[awid] = nil

    -- Emit event
    TriggerEvent(AW.EVENT.PLAYER_RESPAWNED, {
        awid          = awid,
        aircraft_type = aircraftType,
        base          = timer.base,
    })

    CoreLogger.Info('aw-respawn', ('Player %s respawned in %s'):format(awid, aircraftType))
end)

-- ============================================================
-- EXPORTS
-- ============================================================

--- Get remaining respawn time for a player
---@param awid string
---@return number remaining_ms
function RespawnManager.GetRespawnTimer(awid)
    local timer = respawnTimers[awid]
    if not timer then return 0 end

    local elapsed = GetGameTimer() - timer.started
    local remaining = timer.duration - elapsed
    return math.max(0, remaining)
end

--- Get current respawn state for a player
---@param awid string
---@return table|nil state
function RespawnManager.GetRespawnState(awid)
    local timer = respawnTimers[awid]
    if not timer then return nil end

    return {
        started   = timer.started,
        duration  = timer.duration,
        expired   = timer.expired,
        base      = timer.base,
        remaining = RespawnManager.GetRespawnTimer(awid),
    }
end

--- Get available bases for the player to respawn at
---@param awid string
---@return table bases
function RespawnManager.GetAvailableBases(awid)
    local faction = exports['aw-faction']:GetFaction(awid)
    if not faction then return {} end

    local zones = exports['aw-world']:GetAllZones()
    if not zones then return {} end

    local bases = {}
    for _, zone in pairs(zones) do
        if zone.owner == faction and zone.base then
            local isOperational = exports['aw-world']:IsBaseOperational(zone.id)
            local isSupplied    = exports['aw-world']:IsBaseSupplied(zone.id)

            if isOperational and isSupplied then
                bases[#bases + 1] = {
                    id   = zone.id,
                    name = zone.display or zone.id,
                    pos  = zone.base.pos,
                }
            end
        end
    end

    return bases
end

--- Force respawn a player (admin)
---@param awid string
function RespawnManager.ForceRespawn(awid)
    local timer = respawnTimers[awid]
    if timer then
        timer.expired = true
        timer.duration = 0

        if timer.source then
            TriggerClientEvent('aw:respawn:timer_expired', timer.source, {
                base = timer.base,
            })
        end
    end
end

-- ============================================================
-- EVENT HANDLERS
-- ============================================================

--- Aircraft destroyed — begin respawn sequence
AddEventHandler(AW.EVENT.AIRCRAFT_DESTROYED, function(data)
    if not data or not data.owner_awid then return end

    local awid = data.owner_awid
    local source = data.source

    if not source then return end

    startRespawnTimer(awid, source, {
        role        = data.role,
        position    = data.position,
        killer_awid = data.killer_awid,
        aeid        = data.aeid,
    })
end)

--- Player dropped — cancel any active respawn timer
AddEventHandler(AW.EVENT.PLAYER_DROPPED, function(data)
    if data and data.awid then
        respawnTimers[data.awid] = nil
    end
end)

--- War reset — clear all timers
AddEventHandler(AW.EVENT.WAR_RESET, function()
    respawnTimers = {}
end)

-- ============================================================
-- PERIODIC TASKS
-- ============================================================

-- Timer tick every 500ms
CreateThread(function()
    while true do
        Wait(500)
        if initialized then
            tickTimers()
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
            name     = 'aw-respawn',
            version  = '1.0.0',
            priority = 400,
        })
    end

    CoreLogger.Info('aw-respawn', 'Respawn module initialized')
end)

-- ============================================================
-- EXPORTS REGISTRATION
-- ============================================================

exports('GetRespawnTimer',   function(...) return RespawnManager.GetRespawnTimer(...) end)
exports('GetRespawnState',   function(...) return RespawnManager.GetRespawnState(...) end)
exports('GetAvailableBases', function(...) return RespawnManager.GetAvailableBases(...) end)
exports('ForceRespawn',      function(...) return RespawnManager.ForceRespawn(...) end)
