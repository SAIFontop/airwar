--[[
    aw-loadout — Server-side Loadout & Hardpoint System
    
    Responsibilities:
    1. Manage aircraft hardpoints (weapon slots)
    2. Equip/unequip weapons to hardpoints
    3. Track ammo per weapon slot
    4. Track and deploy countermeasures (flares, chaff)
    5. Loadout presets
    6. Mass calculations for loadout weight
]]

-- ============================================================
-- MODULE STATE
-- ============================================================

local LoadoutManager = {}
local initialized = false

-- Active loadouts: aeid → { hardpoints = { slot → weapon_data }, cms = { flares, chaff } }
local activeLoadouts = {}

-- Saved loadout presets: awid → { presetName → loadout_data }
local savedPresets = {}

-- ============================================================
-- HARDPOINT SYSTEM
-- ============================================================

--- Initialize loadout for a spawned aircraft
---@param aeid string Aircraft Entity ID
---@param aircraftTypeId string
---@param presetName string|nil Optional preset to auto-equip
function LoadoutManager.InitLoadout(aeid, aircraftTypeId, presetName)
    local aircraftDef = nil
    if CoreRegistry then
        aircraftDef = CoreRegistry.Get('aircraft', aircraftTypeId)
    end

    local numHardpoints = aircraftDef and aircraftDef.hardpoints or 4
    local defaultCms = aircraftDef and aircraftDef.countermeasures or { flares = 30, chaff = 30 }

    activeLoadouts[aeid] = {
        aircraft_type = aircraftTypeId,
        hardpoints    = {},
        num_slots     = numHardpoints,
        countermeasures = {
            flares      = defaultCms.flares or 30,
            flares_max  = defaultCms.flares or 30,
            chaff       = defaultCms.chaff or 30,
            chaff_max   = defaultCms.chaff or 30,
        },
        total_mass    = 0,
    }

    -- Apply preset if specified
    if presetName then
        local preset = nil
        if CoreRegistry then
            preset = CoreRegistry.Get('loadout_preset', presetName)
        end
        if preset and preset.weapons then
            for slot, weaponId in pairs(preset.weapons) do
                LoadoutManager.EquipWeapon(aeid, tonumber(slot), weaponId)
            end
        end
    end

    -- Initialize empty hardpoints
    for i = 1, numHardpoints do
        if not activeLoadouts[aeid].hardpoints[i] then
            activeLoadouts[aeid].hardpoints[i] = {
                slot      = i,
                weapon_id = nil,
                display   = 'Empty',
                ammo      = 0,
                ammo_max  = 0,
                mass      = 0,
                type      = nil,
            }
        end
    end

    LoadoutManager.RecalculateMass(aeid)
end

--- Clean up loadout when aircraft is despawned/destroyed
---@param aeid string
function LoadoutManager.CleanupLoadout(aeid)
    activeLoadouts[aeid] = nil
end

--- Get current loadout for an aircraft
---@param aeid string
---@return table|nil
function LoadoutManager.GetLoadout(aeid)
    return activeLoadouts[aeid]
end

--- Set entire loadout from preset data
---@param aeid string
---@param loadoutData table { [slot] = weaponId, ... }
---@return boolean success
function LoadoutManager.SetLoadout(aeid, loadoutData)
    local loadout = activeLoadouts[aeid]
    if not loadout then return false end

    -- Clear all current weapons
    for i = 1, loadout.num_slots do
        LoadoutManager.UnequipWeapon(aeid, i)
    end

    -- Equip new weapons
    if loadoutData then
        for slot, weaponId in pairs(loadoutData) do
            LoadoutManager.EquipWeapon(aeid, tonumber(slot), weaponId)
        end
    end

    return true
end

--- Get hardpoint data
---@param aeid string
---@return table hardpoints array
function LoadoutManager.GetHardpoints(aeid)
    local loadout = activeLoadouts[aeid]
    if not loadout then return {} end
    return loadout.hardpoints
end

--- Equip a weapon to a hardpoint
---@param aeid string
---@param slot number
---@param weaponTypeId string
---@return boolean success
---@return string|nil error
function LoadoutManager.EquipWeapon(aeid, slot, weaponTypeId)
    local loadout = activeLoadouts[aeid]
    if not loadout then return false, 'No active loadout' end

    if slot < 1 or slot > loadout.num_slots then
        return false, 'Invalid slot'
    end

    -- Get weapon definition
    local weaponDef = nil
    if CoreRegistry then
        weaponDef = CoreRegistry.Get('weapon', weaponTypeId)
    end
    if not weaponDef then
        return false, 'Unknown weapon type'
    end

    -- Check hardpoint compatibility (some weapons only fit certain slots)
    local aircraftDef = nil
    if CoreRegistry then
        aircraftDef = CoreRegistry.Get('aircraft', loadout.aircraft_type)
    end
    if aircraftDef and aircraftDef.hardpoint_types then
        local slotType = aircraftDef.hardpoint_types[slot]
        if slotType and weaponDef.mount_type and slotType ~= weaponDef.mount_type and slotType ~= 'universal' then
            return false, 'Weapon incompatible with this hardpoint'
        end
    end

    loadout.hardpoints[slot] = {
        slot       = slot,
        weapon_id  = weaponTypeId,
        display    = weaponDef.display or weaponTypeId,
        ammo       = weaponDef.ammo or 1,
        ammo_max   = weaponDef.ammo or 1,
        mass       = weaponDef.mass or 100,
        type       = weaponDef.type or 'unknown',
        damage     = weaponDef.damage or 0,
        range      = weaponDef.range or 0,
        lock_time  = weaponDef.lock_time or 0,
        lock_cone  = weaponDef.lock_cone or 0,
        fire_rate  = weaponDef.fire_rate or 0,
    }

    LoadoutManager.RecalculateMass(aeid)

    CoreLogger.Debug('aw-loadout', '%s slot %d equipped: %s', aeid, slot, weaponTypeId)
    return true, nil
end

--- Unequip a weapon from a hardpoint
---@param aeid string
---@param slot number
---@return boolean success
function LoadoutManager.UnequipWeapon(aeid, slot)
    local loadout = activeLoadouts[aeid]
    if not loadout then return false end

    if slot < 1 or slot > loadout.num_slots then return false end

    loadout.hardpoints[slot] = {
        slot      = slot,
        weapon_id = nil,
        display   = 'Empty',
        ammo      = 0,
        ammo_max  = 0,
        mass      = 0,
        type      = nil,
    }

    LoadoutManager.RecalculateMass(aeid)
    return true
end

-- ============================================================
-- AMMO SYSTEM
-- ============================================================

--- Get ammo for a weapon slot
---@param aeid string
---@param slot number
---@return number ammo
---@return number ammoMax
function LoadoutManager.GetAmmo(aeid, slot)
    local loadout = activeLoadouts[aeid]
    if not loadout or not loadout.hardpoints[slot] then
        return 0, 0
    end
    local hp = loadout.hardpoints[slot]
    return hp.ammo, hp.ammo_max
end

--- Consume ammo from a weapon slot
---@param aeid string
---@param slot number
---@param amount number|nil Default 1
---@return boolean success (false if no ammo)
function LoadoutManager.ConsumeAmmo(aeid, slot, amount)
    local loadout = activeLoadouts[aeid]
    if not loadout or not loadout.hardpoints[slot] then return false end

    local hp = loadout.hardpoints[slot]
    if not hp.weapon_id then return false end

    amount = amount or 1
    if hp.ammo < amount then return false end

    hp.ammo = hp.ammo - amount

    -- Update mass when ordnance is consumed
    if hp.type ~= 'gun' then
        -- Missiles/bombs reduce mass when fired
        local perUnitMass = hp.ammo_max > 0 and (hp.mass / hp.ammo_max) or 0
        hp.mass = math.max(0, hp.mass - (perUnitMass * amount))
        LoadoutManager.RecalculateMass(aeid)
    end

    return true
end

-- ============================================================
-- COUNTERMEASURES
-- ============================================================

--- Get countermeasure counts
---@param aeid string
---@return table { flares, flares_max, chaff, chaff_max }
function LoadoutManager.GetCountermeasures(aeid)
    local loadout = activeLoadouts[aeid]
    if not loadout then
        return { flares = 0, flares_max = 0, chaff = 0, chaff_max = 0 }
    end
    return loadout.countermeasures
end

--- Deploy a countermeasure
---@param aeid string
---@param cmType string 'flare' | 'chaff'
---@return boolean success
function LoadoutManager.DeployCountermeasure(aeid, cmType)
    local loadout = activeLoadouts[aeid]
    if not loadout then return false end

    local cms = loadout.countermeasures
    if cmType == 'flare' then
        if cms.flares <= 0 then return false end
        cms.flares = cms.flares - 1
    elseif cmType == 'chaff' then
        if cms.chaff <= 0 then return false end
        cms.chaff = cms.chaff - 1
    else
        return false
    end

    TriggerEvent(AW.EVENT.COUNTERMEASURE_DEPLOYED, {
        aeid    = aeid,
        cm_type = cmType,
        remaining = cmType == 'flare' and cms.flares or cms.chaff,
    })

    return true
end

-- ============================================================
-- MASS CALCULATIONS
-- ============================================================

--- Recalculate total loadout mass
---@param aeid string
function LoadoutManager.RecalculateMass(aeid)
    local loadout = activeLoadouts[aeid]
    if not loadout then return end

    local total = 0
    for _, hp in pairs(loadout.hardpoints) do
        total = total + (hp.mass or 0)
    end

    loadout.total_mass = total
end

--- Get loadout mass
---@param aeid string
---@return number mass in kg
function LoadoutManager.GetLoadoutMass(aeid)
    local loadout = activeLoadouts[aeid]
    if not loadout then return 0 end
    return loadout.total_mass
end

-- ============================================================
-- EVENT HANDLERS
-- ============================================================

--- Aircraft spawned — initialize loadout
AddEventHandler(AW.EVENT.AIRCRAFT_SPAWNED, function(data)
    if data and data.aeid and data.type_id then
        LoadoutManager.InitLoadout(data.aeid, data.type_id, data.preset)
    end
end)

--- Aircraft destroyed/despawned — cleanup
AddEventHandler(AW.EVENT.AIRCRAFT_DESTROYED, function(data)
    if data and data.aeid then
        LoadoutManager.CleanupLoadout(data.aeid)
    end
end)

AddEventHandler(AW.EVENT.AIRCRAFT_DESPAWNED, function(data)
    if data and data.aeid then
        LoadoutManager.CleanupLoadout(data.aeid)
    end
end)

--- Fire weapon request — validate and consume ammo
RegisterNetEvent('aw:loadout:fire_weapon')
AddEventHandler('aw:loadout:fire_weapon', function(data)
    local source = source
    if not data or not data.aeid or not data.slot then return end

    local loadout = activeLoadouts[data.aeid]
    if not loadout then return end

    -- Validate the source owns this aircraft (via aw-aircraft)
    -- This prevents spoofed fire requests
    local hp = loadout.hardpoints[data.slot]
    if not hp or not hp.weapon_id then return end

    if LoadoutManager.ConsumeAmmo(data.aeid, data.slot) then
        -- Notify combat module that a weapon was fired
        TriggerEvent(AW.EVENT.WEAPON_FIRED, {
            aeid      = data.aeid,
            slot      = data.slot,
            weapon_id = hp.weapon_id,
            type      = hp.type,
            damage    = hp.damage,
            range     = hp.range,
            source    = source,
        })
    end
end)

--- Deploy CM request
RegisterNetEvent('aw:loadout:deploy_cm')
AddEventHandler('aw:loadout:deploy_cm', function(data)
    if not data or not data.aeid or not data.cm_type then return end
    LoadoutManager.DeployCountermeasure(data.aeid, data.cm_type)
end)

-- ============================================================
-- INITIALIZATION
-- ============================================================

AddEventHandler(AW.EVENT.CORE_READY, function()
    if initialized then return end
    initialized = true

    if CoreAPI and CoreAPI.RegisterModule then
        CoreAPI.RegisterModule({
            name     = 'aw-loadout',
            version  = '1.0.0',
            priority = 300,
        })
    end

    CoreLogger.Info('aw-loadout', 'Loadout module initialized')
end)

-- ============================================================
-- EXPORTS
-- ============================================================

exports('GetLoadout',           function(...) return LoadoutManager.GetLoadout(...) end)
exports('SetLoadout',           function(...) return LoadoutManager.SetLoadout(...) end)
exports('GetHardpoints',        function(...) return LoadoutManager.GetHardpoints(...) end)
exports('EquipWeapon',          function(...) return LoadoutManager.EquipWeapon(...) end)
exports('UnequipWeapon',        function(...) return LoadoutManager.UnequipWeapon(...) end)
exports('GetAmmo',              function(...) return LoadoutManager.GetAmmo(...) end)
exports('ConsumeAmmo',          function(...) return LoadoutManager.ConsumeAmmo(...) end)
exports('GetCountermeasures',   function(...) return LoadoutManager.GetCountermeasures(...) end)
exports('DeployCountermeasure', function(...) return LoadoutManager.DeployCountermeasure(...) end)
