--[[
    aw-targeting — Client Radar Display, Lock Tone, RWR
    
    Responsibilities:
    1. Receive filtered contacts from server
    2. Draw radar scope data → push to NUI
    3. Lock-on input handling (lock request / break)
    4. Lock tone audio (searching, locked)
    5. RWR warning indicators
    6. Missile launch warning
]]

-- ============================================================
-- CLIENT STATE
-- ============================================================

local contacts = {}       -- Array of contact data from server
local isFlying = false
local myAeid = nil

-- Lock state
local currentLockId = nil
local lockTarget = nil    -- Currently locked/locking target aeid
local lockState = nil     -- 'locking' | 'locked' | nil
local lockProgress = 0

-- RWR
local rwrWarnings = {}    -- Array of { type, lock_state, direction, expires }

-- Audio
local lockSearchSound = nil
local lockAchievedSound = nil
local rwrSound = nil

-- ============================================================
-- CONTACT PROCESSING
-- ============================================================

--- Process contacts update from server
RegisterNetEvent('aw:targeting:contacts_update')
AddEventHandler('aw:targeting:contacts_update', function(contactList)
    contacts = contactList or {}

    -- Push to NUI radar
    if isFlying then
        pushRadarHud()
    end
end)

--- Push radar data to NUI
function pushRadarHud()
    local radarContacts = {}
    for i = 1, #contacts do
        local c = contacts[i]
        radarContacts[#radarContacts + 1] = {
            aeid     = c.aeid,
            bearing  = c.bearing,
            distance = c.distance,
            altitude = c.altitude,
            iff      = c.iff,
            type     = c.type,
            speed    = c.speed,
            locked   = (lockTarget == c.aeid),
            locking  = (lockTarget == c.aeid and lockState == 'locking'),
        }
    end

    SendNUIMessage({
        type = 'radar_update',
        data = {
            contacts      = radarContacts,
            lock_state    = lockState,
            lock_target   = lockTarget,
            lock_progress = lockProgress,
            rwr           = formatRwrForHud(),
        }
    })
end

--- Format RWR warnings for HUD
function formatRwrForHud()
    local now = GetGameTimer()
    local active = {}
    for i = #rwrWarnings, 1, -1 do
        if now < rwrWarnings[i].expires then
            active[#active + 1] = {
                type       = rwrWarnings[i].type,
                lock_state = rwrWarnings[i].lock_state,
                direction  = rwrWarnings[i].direction,
            }
        else
            table.remove(rwrWarnings, i)
        end
    end
    return active
end

-- ============================================================
-- LOCK-ON INPUT
-- ============================================================

--- Cycle to nearest hostile and request lock
local function requestLockOnNearest()
    if not isFlying then return end

    -- If already locked, break first
    if currentLockId then
        TriggerServerEvent('aw:targeting:break_lock', currentLockId)
        currentLockId = nil
        lockTarget = nil
        lockState = nil
        lockProgress = 0
        stopLockAudio()
        return
    end

    -- Find nearest hostile
    local nearestDist = math.huge
    local nearestAeid = nil
    for i = 1, #contacts do
        local c = contacts[i]
        if c.iff == 'hostile' and c.distance < nearestDist then
            nearestDist = c.distance
            nearestAeid = c.aeid
        end
    end

    if nearestAeid then
        TriggerServerEvent('aw:targeting:request_lock', nearestAeid, 'aim_radar')
    end
end

--- Cycle lock to next hostile
local function cycleLockTarget()
    if not isFlying or #contacts == 0 then return end

    local hostiles = {}
    for i = 1, #contacts do
        if contacts[i].iff == 'hostile' then
            hostiles[#hostiles + 1] = contacts[i]
        end
    end
    if #hostiles == 0 then return end

    -- Sort by distance
    table.sort(hostiles, function(a, b) return a.distance < b.distance end)

    -- Find next after current
    local nextTarget = hostiles[1].aeid
    if lockTarget then
        for i = 1, #hostiles do
            if hostiles[i].aeid == lockTarget then
                nextTarget = hostiles[(i % #hostiles) + 1].aeid
                break
            end
        end
    end

    -- Break current lock if any
    if currentLockId then
        TriggerServerEvent('aw:targeting:break_lock', currentLockId)
    end

    -- Request new lock
    TriggerServerEvent('aw:targeting:request_lock', nextTarget, 'aim_radar')
end

-- ============================================================
-- LOCK RESPONSE EVENTS
-- ============================================================

RegisterNetEvent('aw:targeting:lock_started')
AddEventHandler('aw:targeting:lock_started', function(data)
    currentLockId = data.lock_id
    lockTarget = data.target_aeid
    lockState = 'locking'
    lockProgress = 0
    startLockSearchAudio()
end)

RegisterNetEvent('aw:targeting:lock_achieved')
AddEventHandler('aw:targeting:lock_achieved', function(data)
    if data.lock_id == currentLockId then
        lockState = 'locked'
        lockProgress = 1.0
        stopLockAudio()
        playLockAchievedAudio()
    end
end)

RegisterNetEvent('aw:targeting:lock_broken_notify')
AddEventHandler('aw:targeting:lock_broken_notify', function(data)
    if data.lock_id == currentLockId then
        currentLockId = nil
        lockTarget = nil
        lockState = nil
        lockProgress = 0
        stopLockAudio()
    end
end)

RegisterNetEvent('aw:targeting:lock_progress')
AddEventHandler('aw:targeting:lock_progress', function(data)
    if data.lock_id == currentLockId then
        lockProgress = data.progress
    end
end)

-- ============================================================
-- RWR (Radar Warning Receiver)
-- ============================================================

RegisterNetEvent('aw:targeting:rwr_warning')
AddEventHandler('aw:targeting:rwr_warning', function(data)
    if not isFlying then return end

    rwrWarnings[#rwrWarnings + 1] = {
        type       = data.type or 'unknown',
        lock_state = data.lock_state or 'locking',
        direction  = data.direction or 0,
        expires    = GetGameTimer() + 5000, -- Show for 5 seconds
    }

    -- Audio warning
    if data.lock_state == 'locked' then
        playRwrLockedAudio()
    else
        playRwrSearchAudio()
    end

    -- Push immediate update to HUD
    SendNUIMessage({
        type = 'rwr_warning',
        data = {
            type       = data.type,
            lock_state = data.lock_state,
            direction  = data.direction,
        }
    })
end)

-- ============================================================
-- AUDIO
-- ============================================================

function startLockSearchAudio()
    stopLockAudio()
    -- Pulsing search tone
    lockSearchSound = GetSoundId()
    PlaySoundFrontend(lockSearchSound, 'RADAR_ACTIVATE', 'DLC_BTL_Player_Sounds')
end

function stopLockAudio()
    if lockSearchSound then
        StopSound(lockSearchSound)
        ReleaseSoundId(lockSearchSound)
        lockSearchSound = nil
    end
    if lockAchievedSound then
        StopSound(lockAchievedSound)
        ReleaseSoundId(lockAchievedSound)
        lockAchievedSound = nil
    end
end

function playLockAchievedAudio()
    lockAchievedSound = GetSoundId()
    PlaySoundFrontend(lockAchievedSound, 'CHECKPOINT_PERFECT', 'HUD_MINI_GAME_SOUNDSET')
end

function playRwrSearchAudio()
    local id = GetSoundId()
    PlaySoundFrontend(id, 'NAV_LEFT_RIGHT', 'HUD_FRONTEND_DEFAULT_SOUNDSET')
    ReleaseSoundId(id)
end

function playRwrLockedAudio()
    local id = GetSoundId()
    PlaySoundFrontend(id, 'LOSE_1ST', 'HUD_MINI_GAME_SOUNDSET')
    ReleaseSoundId(id)
end

-- ============================================================
-- CONTROLS
-- ============================================================

-- T = Lock nearest / break lock
-- Y = Cycle lock target

CreateThread(function()
    while true do
        Wait(0)
        if isFlying then
            -- T key (245) — Lock/Break
            if IsControlJustPressed(0, 245) then
                requestLockOnNearest()
            end

            -- Y key (246) — Cycle target
            if IsControlJustPressed(0, 246) then
                cycleLockTarget()
            end
        end
    end
end)

-- ============================================================
-- AIRCRAFT EVENTS
-- ============================================================

AddEventHandler(AW.EVENT.AIRCRAFT_SPAWNED, function(data)
    if data and data.aeid then
        isFlying = true
        myAeid = data.aeid
        contacts = {}
        lockTarget = nil
        lockState = nil
        currentLockId = nil
        lockProgress = 0
        rwrWarnings = {}
    end
end)

AddEventHandler(AW.EVENT.AIRCRAFT_DESTROYED, function(data)
    if data and data.aeid and data.aeid == myAeid then
        cleanup()
    end
end)

AddEventHandler(AW.EVENT.AIRCRAFT_DESPAWNED, function(data)
    if data and data.aeid and data.aeid == myAeid then
        cleanup()
    end
end)

function cleanup()
    isFlying = false
    myAeid = nil
    contacts = {}
    lockTarget = nil
    lockState = nil
    currentLockId = nil
    lockProgress = 0
    rwrWarnings = {}
    stopLockAudio()

    SendNUIMessage({
        type = 'radar_update',
        data = {
            contacts   = {},
            lock_state = nil,
            rwr        = {},
        }
    })
end

-- ============================================================
-- RESOURCE STOP CLEANUP
-- ============================================================

AddEventHandler('onResourceStop', function(resource)
    if resource ~= GetCurrentResourceName() then return end
    cleanup()
end)
