--[[
    aw-loadout — Client-side Loadout Display & Input
    
    Responsibilities:
    1. Push loadout HUD data (ammo, CMs, weapon slots)
    2. Handle weapon fire input
    3. Handle countermeasure deploy input
    4. Weapon switch input
]]

-- ============================================================
-- CLIENT STATE
-- ============================================================

local currentAeid = nil
local currentLoadout = nil
local selectedSlot = 1
local isInAircraft = false

-- Cooldown trackers
local lastFireTime = 0
local lastCmTime = 0
local FIRE_COOLDOWN = 100   -- ms between shots
local CM_COOLDOWN = 500     -- ms between CM deploys

-- Control mappings
local KEY_FIRE       = 69     -- INPUT_VEH_ATTACK         (LMB)
local KEY_FIRE_ALT   = 68     -- INPUT_VEH_ATTACK2        (RMB for missiles)
local KEY_FLARE      = 26     -- INPUT_LOOK_BEHIND        (C key)
local KEY_CHAFF      = 73     -- INPUT_VEH_DUCK           (X key)
local KEY_NEXT_WPN   = 14     -- INPUT_WEAPON_WHEEL_NEXT  (Mouse wheel up)
local KEY_PREV_WPN   = 15     -- INPUT_WEAPON_WHEEL_PREV  (Mouse wheel down)

-- ============================================================
-- WEAPON FIRE
-- ============================================================

--- Attempt to fire the selected weapon
local function tryFireWeapon()
    if not currentAeid then return end

    local now = GetGameTimer()
    if now - lastFireTime < FIRE_COOLDOWN then return end
    lastFireTime = now

    TriggerServerEvent('aw:loadout:fire_weapon', {
        aeid = currentAeid,
        slot = selectedSlot,
    })
end

--- Attempt to fire missile/guided weapon (secondary fire)
local function tryFireSecondary()
    if not currentAeid then return end

    local now = GetGameTimer()
    if now - lastFireTime < FIRE_COOLDOWN then return end
    lastFireTime = now

    -- Find first missile/bomb slot
    if currentLoadout and currentLoadout.hardpoints then
        for i, hp in pairs(currentLoadout.hardpoints) do
            if hp.weapon_id and hp.ammo > 0 and (hp.type == 'aim_ir' or hp.type == 'aim_radar' or hp.type == 'agm' or hp.type == 'bomb') then
                TriggerServerEvent('aw:loadout:fire_weapon', {
                    aeid = currentAeid,
                    slot = i,
                })
                return
            end
        end
    end
end

-- ============================================================
-- COUNTERMEASURE DEPLOY
-- ============================================================

local function tryDeployFlare()
    if not currentAeid then return end

    local now = GetGameTimer()
    if now - lastCmTime < CM_COOLDOWN then return end
    lastCmTime = now

    TriggerServerEvent('aw:loadout:deploy_cm', {
        aeid    = currentAeid,
        cm_type = 'flare',
    })
end

local function tryDeployChaff()
    if not currentAeid then return end

    local now = GetGameTimer()
    if now - lastCmTime < CM_COOLDOWN then return end
    lastCmTime = now

    TriggerServerEvent('aw:loadout:deploy_cm', {
        aeid    = currentAeid,
        cm_type = 'chaff',
    })
end

-- ============================================================
-- WEAPON SWITCHING
-- ============================================================

local function nextWeapon()
    if not currentLoadout then return end
    local max = currentLoadout.num_slots or 4
    selectedSlot = (selectedSlot % max) + 1

    -- Push to HUD
    SendNUIMessage({
        type = 'loadout_slot_changed',
        data = { slot = selectedSlot },
    })
end

local function prevWeapon()
    if not currentLoadout then return end
    local max = currentLoadout.num_slots or 4
    selectedSlot = selectedSlot - 1
    if selectedSlot < 1 then selectedSlot = max end

    SendNUIMessage({
        type = 'loadout_slot_changed',
        data = { slot = selectedSlot },
    })
end

-- ============================================================
-- HUD DATA PUSH
-- ============================================================

--- Push loadout data to HUD
local function pushLoadoutHud()
    if not currentLoadout then return end

    local hardpointData = {}
    for i, hp in pairs(currentLoadout.hardpoints) do
        hardpointData[i] = {
            slot      = hp.slot,
            weapon    = hp.display or 'Empty',
            ammo      = hp.ammo or 0,
            ammo_max  = hp.ammo_max or 0,
            type      = hp.type,
            selected  = i == selectedSlot,
        }
    end

    SendNUIMessage({
        type = 'loadout_update',
        data = {
            hardpoints      = hardpointData,
            selected_slot   = selectedSlot,
            flares          = currentLoadout.countermeasures.flares,
            flares_max      = currentLoadout.countermeasures.flares_max,
            chaff           = currentLoadout.countermeasures.chaff,
            chaff_max       = currentLoadout.countermeasures.chaff_max,
        },
    })
end

-- ============================================================
-- EVENT HANDLERS
-- ============================================================

--- Aircraft spawned for this player
RegisterNetEvent(AW.EVENT.AIRCRAFT_SPAWNED)
AddEventHandler(AW.EVENT.AIRCRAFT_SPAWNED, function(data)
    if data and data.aeid then
        currentAeid = data.aeid
        isInAircraft = true
        selectedSlot = 1
    end
end)

--- Aircraft destroyed/despawned
RegisterNetEvent(AW.EVENT.AIRCRAFT_DESTROYED)
AddEventHandler(AW.EVENT.AIRCRAFT_DESTROYED, function(data)
    if data and data.aeid == currentAeid then
        currentAeid = nil
        currentLoadout = nil
        isInAircraft = false
    end
end)

RegisterNetEvent(AW.EVENT.AIRCRAFT_DESPAWNED)
AddEventHandler(AW.EVENT.AIRCRAFT_DESPAWNED, function(data)
    if data and data.aeid == currentAeid then
        currentAeid = nil
        currentLoadout = nil
        isInAircraft = false
    end
end)

--- Loadout sync from server
RegisterNetEvent('aw:loadout:sync')
AddEventHandler('aw:loadout:sync', function(data)
    if data then
        currentLoadout = data
    end
end)

--- Countermeasure deployed confirmation
RegisterNetEvent(AW.EVENT.COUNTERMEASURE_DEPLOYED)
AddEventHandler(AW.EVENT.COUNTERMEASURE_DEPLOYED, function(data)
    if not data or data.aeid ~= currentAeid then return end

    -- Update local CM count
    if currentLoadout then
        if data.cm_type == 'flare' then
            currentLoadout.countermeasures.flares = data.remaining
        elseif data.cm_type == 'chaff' then
            currentLoadout.countermeasures.chaff = data.remaining
        end
    end

    -- Visual/audio feedback
    PlaySoundFrontend(-1, 'CONFIRM_BEEP', 'HUD_MINI_GAME_SOUNDSET', true)
end)

-- ============================================================
-- INPUT LOOP
-- ============================================================

CreateThread(function()
    while true do
        if isInAircraft and currentAeid then
            -- Disable default vehicle weapons
            DisableControlAction(0, 69, true)   -- VEH_ATTACK
            DisableControlAction(0, 68, true)   -- VEH_ATTACK2
            DisableControlAction(0, 14, true)   -- WEAPON_WHEEL_NEXT
            DisableControlAction(0, 15, true)   -- WEAPON_WHEEL_PREV

            -- Fire primary
            if IsDisabledControlPressed(0, KEY_FIRE) then
                tryFireWeapon()
            end

            -- Fire secondary (missile)
            if IsDisabledControlJustPressed(0, KEY_FIRE_ALT) then
                tryFireSecondary()
            end

            -- Deploy flare
            if IsDisabledControlJustPressed(0, KEY_FLARE) then
                tryDeployFlare()
            end

            -- Deploy chaff
            if IsDisabledControlJustPressed(0, KEY_CHAFF) then
                tryDeployChaff()
            end

            -- Weapon switch
            if IsDisabledControlJustPressed(0, KEY_NEXT_WPN) then
                nextWeapon()
            end
            if IsDisabledControlJustPressed(0, KEY_PREV_WPN) then
                prevWeapon()
            end

            Wait(0) -- Every frame for input
        else
            Wait(500) -- Idle when not in aircraft
        end
    end
end)

-- ============================================================
-- HUD PUSH LOOP
-- ============================================================

CreateThread(function()
    while true do
        if isInAircraft and currentLoadout then
            pushLoadoutHud()
            Wait(AW and AW.TICK and AW.TICK.HUD_PUSH or 200)
        else
            Wait(1000)
        end
    end
end)
