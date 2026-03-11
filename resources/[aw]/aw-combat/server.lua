--[[
    aw-combat — Server-side Combat System
    
    Responsibilities:
    1. Receive and validate hit reports
    2. Calculate damage per zone based on hit angle and weapon
    3. Apply zone damage via aw-aircraft
    4. Kill attribution (highest contributor or last hit)
    5. Countermeasure resolution
    6. Kill feed tracking
    7. Friendly fire detection
]]

-- ============================================================
-- MODULE STATE
-- ============================================================

local CombatManager = {}
local initialized = false

-- Damage tracking per aircraft: aeid → { [attacker_awid] = totalDamage }
local damageTracker = {}

-- Kill feed: circular buffer of recent kills
local killFeed = {}
local MAX_KILL_FEED = 50

-- Kill attribution mode: 'highest' or 'last_hit'
local killAttribution = 'highest'

-- Zone hit mapping from aspect angle
local ASPECT_ZONES = {
    front  = { 'fuselage', 'avionics' },
    left   = { 'left_wing', 'left_engine' },
    right  = { 'right_wing', 'right_engine' },
    rear   = { 'tail', 'fuel_tank' },
    top    = { 'fuselage' },
    bottom = { 'fuselage' },
}

-- ============================================================
-- HIT VALIDATION
-- ============================================================

--- Validate a hit report from client or weapon fire
---@param data table { attacker_aeid, target_aeid, weapon_id, slot, position, angle }
---@return boolean valid
---@return string|nil reason
local function validateHit(data)
    if not data then return false, 'No data' end
    if not data.attacker_aeid or not data.target_aeid then return false, 'Missing entities' end
    if data.attacker_aeid == data.target_aeid then return false, 'Self-hit' end

    -- Check both aircraft exist
    local attackerData = exports['aw-aircraft']:GetAircraftData(data.attacker_aeid)
    local targetData = exports['aw-aircraft']:GetAircraftData(data.target_aeid)
    if not attackerData then return false, 'Attacker not found' end
    if not targetData then return false, 'Target not found' end

    -- Check weapon exists and has ammo (already consumed by loadout module)
    -- Just verify the weapon type is known
    if data.weapon_id then
        local weaponDef = CoreRegistry and CoreRegistry.Get('weapon', data.weapon_id)
        if not weaponDef then return false, 'Unknown weapon' end
    end

    return true, nil
end

-- ============================================================
-- DAMAGE CALCULATION
-- ============================================================

--- Determine which damage zones are hit based on angle
---@param angle number Attack angle in degrees (0 = front, 90 = side, 180 = rear)
---@return table zones List of zone names
local function getHitZones(angle)
    local aspect
    if angle < 30 or angle > 330 then
        aspect = 'front'
    elseif angle >= 30 and angle < 60 then
        aspect = 'right'
    elseif angle >= 60 and angle < 120 then
        aspect = 'right'
    elseif angle >= 120 and angle < 150 then
        aspect = 'rear'
    elseif angle >= 150 and angle < 210 then
        aspect = 'rear'
    elseif angle >= 210 and angle < 240 then
        aspect = 'rear'
    elseif angle >= 240 and angle < 300 then
        aspect = 'left'
    else
        aspect = 'left'
    end

    return ASPECT_ZONES[aspect] or { 'fuselage' }
end

--- Calculate damage amount based on weapon type
---@param weaponDef table Weapon definition
---@param distance number Distance to target
---@return number damage (0-100 scale per hit)
local function calculateDamage(weaponDef, distance)
    if not weaponDef then return 5 end

    local baseDamage = weaponDef.damage or 10
    local maxRange = weaponDef.range or 5000

    -- Distance falloff for guns (missiles do full damage)
    if weaponDef.type == 'gun' then
        local rangePct = math.min(1.0, distance / maxRange)
        local falloff = 1.0 - (rangePct * 0.5) -- 50% max falloff
        baseDamage = baseDamage * falloff
    end

    return baseDamage
end

-- ============================================================
-- HIT PROCESSING
-- ============================================================

--- Process a validated hit
---@param data table Hit data
function CombatManager.ProcessHit(data)
    local valid, reason = validateHit(data)
    if not valid then
        CoreLogger.Debug('aw-combat', 'Hit rejected: %s', reason or 'unknown')
        return
    end

    local attackerData = exports['aw-aircraft']:GetAircraftData(data.attacker_aeid)
    local targetData = exports['aw-aircraft']:GetAircraftData(data.target_aeid)

    -- Friendly fire check
    local attackerFaction = nil
    local targetFaction = nil
    if attackerData and attackerData.owner_awid then
        attackerFaction = exports['aw-faction']:GetFaction(attackerData.owner_awid)
    end
    if targetData and targetData.owner_awid then
        targetFaction = exports['aw-faction']:GetFaction(targetData.owner_awid)
    end

    local friendlyFire = attackerFaction and targetFaction and attackerFaction == targetFaction
    if friendlyFire then
        TriggerEvent(AW.EVENT.FRIENDLY_FIRE, {
            attacker_awid = attackerData.owner_awid,
            target_awid   = targetData.owner_awid,
            weapon_id     = data.weapon_id,
        })
        -- Reduce friendly fire damage by 75%
        data.damage_mult = 0.25
    end

    -- Get weapon definition
    local weaponDef = nil
    if data.weapon_id and CoreRegistry then
        weaponDef = CoreRegistry.Get('weapon', data.weapon_id)
    end

    -- Calculate damage
    local rawDamage = calculateDamage(weaponDef, data.distance or 0)
    rawDamage = rawDamage * (data.damage_mult or 1.0)

    -- Determine hit zones
    local hitZones = getHitZones(data.angle or 0)

    -- Distribute damage across hit zones
    local damagePerZone = rawDamage / #hitZones
    for _, zone in ipairs(hitZones) do
        exports['aw-aircraft']:DamageZone(data.target_aeid, zone, damagePerZone, attackerData and attackerData.owner_awid)
    end

    -- Track damage for kill attribution
    if attackerData and attackerData.owner_awid then
        if not damageTracker[data.target_aeid] then
            damageTracker[data.target_aeid] = {}
        end
        local tracker = damageTracker[data.target_aeid]
        tracker[attackerData.owner_awid] = (tracker[attackerData.owner_awid] or 0) + rawDamage
    end

    -- Emit hit event
    TriggerEvent(AW.EVENT.COMBAT_HIT, {
        attacker_aeid = data.attacker_aeid,
        target_aeid   = data.target_aeid,
        attacker_awid = attackerData and attackerData.owner_awid,
        target_awid   = targetData and targetData.owner_awid,
        weapon_id     = data.weapon_id,
        damage        = rawDamage,
        zones         = hitZones,
        friendly      = friendlyFire,
    })
end

-- ============================================================
-- KILL ATTRIBUTION
-- ============================================================

--- Attribute a kill when an aircraft is destroyed
---@param aeid string Destroyed aircraft AEID
---@param ownerAwid string Owner AWID of destroyed aircraft
local function attributeKill(aeid, ownerAwid)
    local damageSources = damageTracker[aeid]
    if not damageSources then return end

    local killerAwid = nil
    local maxDamage = 0
    local assisters = {}

    for awid, totalDmg in pairs(damageSources) do
        if killAttribution == 'highest' then
            if totalDmg > maxDamage then
                maxDamage = totalDmg
                killerAwid = awid
            end
        end
        -- Track all damage contributors for assists
        assisters[awid] = totalDmg
    end

    -- For 'last_hit' mode, would track the last hit separately
    if not killerAwid then return end

    -- Remove killer from assisters
    assisters[killerAwid] = nil

    -- Get context data
    local killerFaction = exports['aw-faction']:GetFaction(killerAwid)
    local victimFaction = exports['aw-faction']:GetFaction(ownerAwid)

    -- Build kill data
    local killData = {
        attacker_awid    = killerAwid,
        victim_awid      = ownerAwid,
        attacker_faction = killerFaction,
        victim_faction   = victimFaction,
        weapon_id        = nil, -- Could be tracked per last-hit
        victim_aircraft  = aeid,
        timestamp        = os.time(),
    }

    -- Add to kill feed
    killFeed[#killFeed + 1] = killData
    if #killFeed > MAX_KILL_FEED then
        table.remove(killFeed, 1)
    end

    -- Emit kill event
    TriggerEvent(AW.EVENT.KILL, killData)

    -- Broadcast kill to all clients (for kill feed UI)
    TriggerClientEvent(AW.EVENT.KILL, -1, killData)

    CoreLogger.Info('aw-combat', 'KILL: %s destroyed %s', killerAwid, ownerAwid)

    -- Process assists
    for assisterAwid, dmg in pairs(assisters) do
        TriggerEvent(AW.EVENT.COMBAT_ASSIST, {
            assister_awid = assisterAwid,
            victim_awid   = ownerAwid,
            damage_dealt  = dmg,
        })
    end

    -- Cleanup tracker
    damageTracker[aeid] = nil
end

-- ============================================================
-- COUNTERMEASURE RESOLUTION
-- ============================================================

--- Resolve whether a countermeasure defeats an incoming missile
---@param missileType string 'aim_ir' | 'aim_radar'
---@param cmType string 'flare' | 'chaff'
---@param timing number 0.0-1.0 (how early CM was deployed, 1.0 = perfect)
---@return boolean defeated
function CombatManager.ResolveCM(missileType, cmType, timing)
    -- Flares defeat IR missiles, Chaff defeats radar missiles
    local effectiveness = 0

    if missileType == 'aim_ir' and cmType == 'flare' then
        effectiveness = 0.7 + (timing * 0.25) -- 70-95% base chance
    elseif missileType == 'aim_radar' and cmType == 'chaff' then
        effectiveness = 0.6 + (timing * 0.30) -- 60-90% base chance
    elseif missileType == 'aim_ir' and cmType == 'chaff' then
        effectiveness = 0.1 -- Chaff doesn't help against IR
    elseif missileType == 'aim_radar' and cmType == 'flare' then
        effectiveness = 0.1 -- Flare doesn't help against radar
    end

    local roll = math.random()
    local defeated = roll < effectiveness

    TriggerEvent(AW.EVENT.COUNTERMEASURE_RESOLVED, {
        missile_type  = missileType,
        cm_type       = cmType,
        effectiveness = effectiveness,
        defeated      = defeated,
    })

    return defeated
end

-- ============================================================
-- QUERY API
-- ============================================================

--- Get damage sources for an aircraft
---@param aeid string
---@return table { awid → totalDamage }
function CombatManager.GetDamageSources(aeid)
    return damageTracker[aeid] or {}
end

--- Get recent kill feed
---@param count number|nil
---@return table
function CombatManager.GetKillFeed(count)
    count = count or MAX_KILL_FEED
    local result = {}
    local start = math.max(1, #killFeed - count + 1)
    for i = start, #killFeed do
        result[#result + 1] = killFeed[i]
    end
    return result
end

-- ============================================================
-- EVENT HANDLERS
-- ============================================================

--- Weapon fired — process potential hit (from aw-loadout)
AddEventHandler(AW.EVENT.WEAPON_FIRED, function(data)
    -- For guns: hit detection is handled via client raycast → server validation
    -- For missiles: tracking and impact is handled separately
    -- This is mainly for logging
end)

--- Aircraft destroyed — attribute kill
AddEventHandler(AW.EVENT.AIRCRAFT_DESTROYED, function(data)
    if data and data.aeid and data.owner_awid then
        attributeKill(data.aeid, data.owner_awid)
    end
end)

--- Client hit report (raycast-based gun hits)
RegisterNetEvent('aw:combat:hit_report')
AddEventHandler('aw:combat:hit_report', function(data)
    if not data then return end
    CombatManager.ProcessHit(data)
end)

--- CM resolve request (from targeting when missile impacts)
RegisterNetEvent('aw:combat:resolve_cm')
AddEventHandler('aw:combat:resolve_cm', function(data)
    if not data then return end
    local defeated = CombatManager.ResolveCM(data.missile_type, data.cm_type, data.timing or 0.5)

    -- Notify the target whether CM worked
    if data.target_source then
        TriggerClientEvent('aw:combat:cm_result', data.target_source, {
            defeated     = defeated,
            missile_type = data.missile_type,
        })
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
            name     = 'aw-combat',
            version  = '1.0.0',
            priority = 400,
        })
    end

    CoreLogger.Info('aw-combat', 'Combat module initialized — attribution: %s', killAttribution)
end)

-- ============================================================
-- EXPORTS
-- ============================================================

exports('GetDamageSources', function(...) return CombatManager.GetDamageSources(...) end)
exports('GetKillFeed',      function(...) return CombatManager.GetKillFeed(...) end)
exports('ProcessHit',       function(...) return CombatManager.ProcessHit(...) end)
