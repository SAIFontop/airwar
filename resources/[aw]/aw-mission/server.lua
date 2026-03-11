--[[
    aw-mission — Server-side Mission System
    
    Responsibilities:
    1. Mission generation (automatic from war state, manual from admin)
    2. Mission types: air superiority, strike, defense, escort, recon, supply_run, sead, intercept
    3. State machine per mission: briefing → active → debrief
    4. Objective tracking (kill count, zone presence, asset protection, etc.)
    5. Scoring & rewards (faction score + credits + rank)
    6. Persistence to aw_missions_history
]]

-- ============================================================
-- MODULE STATE
-- ============================================================

local MissionManager = {}
local initialized = false

-- Active missions: missionId → mission_data
local activeMissions = {}
local nextMissionId = 1

-- Player → active missions: awid → { missionId list }
local playerMissions = {}

-- Mission templates loaded from config
local missionTemplates = {}

-- Mission states
local MISSION_STATE = {
    BRIEFING  = 'briefing',
    ACTIVE    = 'active',
    DEBRIEF   = 'debrief',
    COMPLETED = 'completed',
    FAILED    = 'failed',
    EXPIRED   = 'expired',
}

-- Time limits (ms)
local BRIEFING_DURATION = 60000    -- 60s to join
local DEFAULT_MISSION_DURATION = 600000  -- 10 min

-- ============================================================
-- MISSION GENERATION
-- ============================================================

--- Generate a new mission
---@param opts table { type, faction, zone_id, difficulty }
---@return number|nil missionId
function MissionManager.GenerateMission(opts)
    opts = opts or {}

    local mType = opts.type
    local faction = opts.faction

    -- Auto-select type if not specified
    if not mType then
        local types = { 'air_superiority', 'strike', 'defense', 'escort', 'recon', 'supply_run', 'sead', 'intercept' }
        mType = types[math.random(#types)]
    end

    -- Auto-select faction if not specified
    if not faction then
        local factions = exports['aw-faction']:GetAllFactions()
        if factions and #factions > 0 then
            faction = factions[math.random(#factions)].id
        end
    end

    -- Get template from config
    local template = missionTemplates[mType]
    if not template then
        template = getDefaultTemplate(mType)
    end

    -- Select target zone
    local targetZone = opts.zone_id
    if not targetZone then
        targetZone = selectMissionZone(mType, faction)
    end

    local difficulty = opts.difficulty or math.random(1, 3)
    local missionId = nextMissionId
    nextMissionId = nextMissionId + 1

    local mission = {
        id          = missionId,
        type        = mType,
        faction     = faction,
        state       = MISSION_STATE.BRIEFING,
        difficulty  = difficulty,
        zone_id     = targetZone,
        objectives  = buildObjectives(mType, difficulty, targetZone),
        participants = {},
        max_players = template.max_players or 8,
        min_players = template.min_players or 1,
        rewards     = {
            faction_score = (template.base_score or 50) * difficulty,
            credits       = (template.base_credits or 500) * difficulty,
            rank_points   = (template.base_rank or 25) * difficulty,
        },
        created_at     = GetGameTimer(),
        briefing_ends  = GetGameTimer() + BRIEFING_DURATION,
        time_limit     = (template.time_limit or DEFAULT_MISSION_DURATION) * difficulty,
        display_name   = template.display_name or mType,
        description    = template.description or '',
        started_at     = nil,
    }

    activeMissions[missionId] = mission

    -- Broadcast mission available
    TriggerEvent(AW.EVENT.MISSION_AVAILABLE, {
        mission_id = missionId,
        type       = mType,
        faction    = faction,
        zone_id    = targetZone,
        difficulty = difficulty,
    })

    -- Notify faction players
    TriggerClientEvent('aw:mission:available', -1, {
        id           = missionId,
        type         = mType,
        faction      = faction,
        zone_id      = targetZone,
        difficulty   = difficulty,
        display_name = mission.display_name,
        description  = mission.description,
        rewards      = mission.rewards,
        briefing_ends = mission.briefing_ends,
    })

    CoreLogger.Info('aw-mission', ('Mission #%d generated: %s for %s (difficulty %d)'):format(missionId, mType, faction or 'any', difficulty))

    return missionId
end

--- Build objectives for a mission type
---@param mType string
---@param difficulty number
---@param zoneId string|nil
---@return table objectives
function buildObjectives(mType, difficulty, zoneId)
    local objectives = {}

    if mType == 'air_superiority' then
        objectives[1] = {
            type     = 'kill_count',
            target   = 3 * difficulty,
            current  = 0,
            desc     = ('Shoot down %d hostile aircraft'):format(3 * difficulty),
        }
    elseif mType == 'strike' then
        objectives[1] = {
            type     = 'destroy_base',
            zone_id  = zoneId,
            complete = false,
            desc     = 'Destroy the enemy base',
        }
    elseif mType == 'defense' then
        objectives[1] = {
            type      = 'hold_zone',
            zone_id   = zoneId,
            duration  = 180 * difficulty, -- seconds to hold
            elapsed   = 0,
            complete  = false,
            desc      = ('Defend the zone for %d minutes'):format(3 * difficulty),
        }
    elseif mType == 'escort' then
        objectives[1] = {
            type     = 'protect_asset',
            alive    = true,
            complete = false,
            desc     = 'Escort the transport safely to destination',
        }
    elseif mType == 'recon' then
        objectives[1] = {
            type      = 'enter_zone',
            zone_id   = zoneId,
            entered   = false,
            desc      = 'Fly over the target zone and return to base',
        }
        objectives[2] = {
            type      = 'return_base',
            complete  = false,
            desc      = 'Return to friendly base',
        }
    elseif mType == 'supply_run' then
        objectives[1] = {
            type      = 'deliver_supplies',
            zone_id   = zoneId,
            delivered = false,
            desc      = 'Deliver supplies to forward base',
        }
    elseif mType == 'sead' then
        objectives[1] = {
            type     = 'destroy_radar',
            zone_id  = zoneId,
            count    = difficulty,
            current  = 0,
            desc     = ('Destroy %d radar installation(s)'):format(difficulty),
        }
    elseif mType == 'intercept' then
        objectives[1] = {
            type     = 'kill_count',
            target   = 2 * difficulty,
            current  = 0,
            desc     = ('Intercept and destroy %d incoming hostile aircraft'):format(2 * difficulty),
        }
    end

    return objectives
end

--- Select a target zone for a mission
---@param mType string
---@param faction string
---@return string|nil zoneId
function selectMissionZone(mType, faction)
    local zones = exports['aw-world']:GetAllZones()
    if not zones then return nil end

    local candidates = {}

    for _, zone in pairs(zones) do
        if mType == 'air_superiority' or mType == 'intercept' then
            -- Contested zones or enemy zones
            if zone.contested or (zone.owner and zone.owner ~= faction) then
                candidates[#candidates + 1] = zone.id
            end
        elseif mType == 'strike' or mType == 'sead' then
            -- Enemy-held zones with bases
            if zone.owner and zone.owner ~= faction and zone.base then
                candidates[#candidates + 1] = zone.id
            end
        elseif mType == 'defense' then
            -- Friendly zones (defend them)
            if zone.owner == faction then
                candidates[#candidates + 1] = zone.id
            end
        elseif mType == 'escort' or mType == 'supply_run' then
            -- Friendly forward zones
            if zone.owner == faction then
                candidates[#candidates + 1] = zone.id
            end
        elseif mType == 'recon' then
            -- Enemy zones
            if zone.owner and zone.owner ~= faction then
                candidates[#candidates + 1] = zone.id
            end
        end
    end

    if #candidates == 0 then return nil end
    return candidates[math.random(#candidates)]
end

--- Get default template for a type
---@param mType string
---@return table
function getDefaultTemplate(mType)
    return {
        display_name = mType:gsub('_', ' '):gsub('^%l', string.upper),
        description  = 'Standard ' .. mType .. ' mission',
        max_players  = 8,
        min_players  = 1,
        base_score   = 50,
        base_credits = 500,
        base_rank    = 25,
        time_limit   = DEFAULT_MISSION_DURATION,
    }
end

-- ============================================================
-- MISSION PARTICIPATION
-- ============================================================

--- Join a mission
---@param awid string
---@param missionId number
---@return boolean success
---@return string|nil error
function MissionManager.JoinMission(awid, missionId)
    local mission = activeMissions[missionId]
    if not mission then return false, 'Mission not found' end

    if mission.state ~= MISSION_STATE.BRIEFING and mission.state ~= MISSION_STATE.ACTIVE then
        return false, 'Mission not accepting participants'
    end

    -- Check faction
    local playerFaction = exports['aw-faction']:GetFaction(awid)
    if mission.faction and playerFaction ~= mission.faction then
        return false, 'Wrong faction'
    end

    -- Check capacity
    local count = 0
    for _ in pairs(mission.participants) do count = count + 1 end
    if count >= mission.max_players then
        return false, 'Mission full'
    end

    -- Check not already in this mission
    if mission.participants[awid] then
        return false, 'Already in mission'
    end

    mission.participants[awid] = {
        awid      = awid,
        joined_at = GetGameTimer(),
        kills     = 0,
        alive     = true,
    }

    -- Track player → missions
    if not playerMissions[awid] then playerMissions[awid] = {} end
    playerMissions[awid][missionId] = true

    -- Notify participants
    broadcastToMission(missionId, 'aw:mission:player_joined', { awid = awid })

    return true, nil
end

--- Leave a mission
---@param awid string
---@param missionId number
function MissionManager.LeaveMission(awid, missionId)
    local mission = activeMissions[missionId]
    if not mission then return end

    mission.participants[awid] = nil

    if playerMissions[awid] then
        playerMissions[awid][missionId] = nil
    end

    broadcastToMission(missionId, 'aw:mission:player_left', { awid = awid })
end

--- Broadcast event to all mission participants
---@param missionId number
---@param eventName string
---@param data table
function broadcastToMission(missionId, eventName, data)
    local mission = activeMissions[missionId]
    if not mission then return end

    for awid, _ in pairs(mission.participants) do
        local source = CoreIdentity and CoreIdentity.GetSource(awid)
        if source then
            TriggerClientEvent(eventName, source, data)
        end
    end
end

-- ============================================================
-- MISSION STATE MACHINE
-- ============================================================

--- Advance mission briefing → active
local function activateMission(missionId)
    local mission = activeMissions[missionId]
    if not mission or mission.state ~= MISSION_STATE.BRIEFING then return end

    -- Check minimum players
    local count = 0
    for _ in pairs(mission.participants) do count = count + 1 end

    if count < mission.min_players then
        -- Cancel mission — not enough participants
        expireMission(missionId)
        return
    end

    mission.state = MISSION_STATE.ACTIVE
    mission.started_at = GetGameTimer()

    TriggerEvent(AW.EVENT.MISSION_STARTED, {
        mission_id = missionId,
        type       = mission.type,
    })

    broadcastToMission(missionId, 'aw:mission:started', {
        id         = missionId,
        objectives = mission.objectives,
        time_limit = mission.time_limit,
    })

    CoreLogger.Info('aw-mission', ('Mission #%d activated: %s'):format(missionId, mission.type))
end

--- Complete mission successfully
---@param missionId number
function MissionManager.CompleteMission(missionId)
    local mission = activeMissions[missionId]
    if not mission then return end

    mission.state = MISSION_STATE.COMPLETED

    -- Distribute rewards
    for awid, participant in pairs(mission.participants) do
        if participant.alive then
            -- Credits
            if exports['aw-store'] then
                exports['aw-store']:AddBalance(awid, mission.rewards.credits)
            end
        end
    end

    -- Faction score
    if mission.faction and mission.rewards.faction_score > 0 then
        exports['aw-faction']:AddFactionScore(mission.faction, mission.rewards.faction_score)
    end

    -- Emit
    local participantList = {}
    for awid, _ in pairs(mission.participants) do
        participantList[#participantList + 1] = awid
    end

    TriggerEvent(AW.EVENT.MISSION_COMPLETED, {
        mission_id   = missionId,
        type         = mission.type,
        faction      = mission.faction,
        participants = participantList,
        rewards      = mission.rewards,
    })

    -- Notify all participants
    broadcastToMission(missionId, 'aw:mission:completed', {
        id      = missionId,
        rewards = mission.rewards,
    })

    -- Save to history
    saveMissionHistory(mission)

    CoreLogger.Info('aw-mission', ('Mission #%d COMPLETED: %s'):format(missionId, mission.type))

    -- Cleanup
    cleanupMission(missionId)
end

--- Fail a mission
---@param missionId number
---@param reason string|nil
function MissionManager.FailMission(missionId, reason)
    local mission = activeMissions[missionId]
    if not mission then return end

    mission.state = MISSION_STATE.FAILED

    TriggerEvent(AW.EVENT.MISSION_FAILED, {
        mission_id = missionId,
        type       = mission.type,
        reason     = reason,
    })

    broadcastToMission(missionId, 'aw:mission:failed', {
        id     = missionId,
        reason = reason or 'Mission failed',
    })

    saveMissionHistory(mission)
    cleanupMission(missionId)

    CoreLogger.Info('aw-mission', ('Mission #%d FAILED: %s — %s'):format(missionId, mission.type, reason or 'unknown'))
end

--- Expire mission (not enough players, timeout)
function expireMission(missionId)
    local mission = activeMissions[missionId]
    if not mission then return end

    mission.state = MISSION_STATE.EXPIRED

    broadcastToMission(missionId, 'aw:mission:expired', { id = missionId })
    cleanupMission(missionId)
end

--- Cleanup mission from active tracking
---@param missionId number
function cleanupMission(missionId)
    local mission = activeMissions[missionId]
    if mission then
        for awid, _ in pairs(mission.participants) do
            if playerMissions[awid] then
                playerMissions[awid][missionId] = nil
            end
        end
    end
    activeMissions[missionId] = nil
end

-- ============================================================
-- OBJECTIVE TRACKING
-- ============================================================

--- Check objectives and auto-complete mission if all done
---@param missionId number
local function checkObjectives(missionId)
    local mission = activeMissions[missionId]
    if not mission or mission.state ~= MISSION_STATE.ACTIVE then return end

    local allComplete = true
    for _, obj in ipairs(mission.objectives) do
        if obj.type == 'kill_count' then
            if (obj.current or 0) < (obj.target or 1) then
                allComplete = false
            end
        elseif obj.type == 'hold_zone' then
            if not obj.complete then
                allComplete = false
            end
        elseif obj.type == 'destroy_base' then
            if not obj.complete then
                allComplete = false
            end
        elseif obj.type == 'enter_zone' or obj.type == 'return_base' or obj.type == 'deliver_supplies' or obj.type == 'protect_asset' then
            if not obj.complete then
                allComplete = false
            end
        elseif obj.type == 'destroy_radar' then
            if (obj.current or 0) < (obj.count or 1) then
                allComplete = false
            end
        end
    end

    if allComplete then
        MissionManager.CompleteMission(missionId)
    end
end

--- Handle kill event for mission objectives
---@param killData table
local function onKill(killData)
    if not killData then return end

    local killerAwid = killData.killer_awid

    -- Find active missions for killer
    if killerAwid and playerMissions[killerAwid] then
        for missionId, _ in pairs(playerMissions[killerAwid]) do
            local mission = activeMissions[missionId]
            if mission and mission.state == MISSION_STATE.ACTIVE then
                -- Update participant kills
                if mission.participants[killerAwid] then
                    mission.participants[killerAwid].kills = (mission.participants[killerAwid].kills or 0) + 1
                end

                -- Update kill_count objectives
                for _, obj in ipairs(mission.objectives) do
                    if obj.type == 'kill_count' then
                        obj.current = (obj.current or 0) + 1
                        TriggerEvent(AW.EVENT.MISSION_OBJECTIVE_COMPLETED, {
                            mission_id = missionId,
                            objective  = obj,
                        })
                    end
                end

                checkObjectives(missionId)
            end
        end
    end

    -- Check if killed aircraft was part of a defend/escort mission
    local victimAwid = killData.victim_awid
    if victimAwid then
        for missionId, mission in pairs(activeMissions) do
            if mission.state == MISSION_STATE.ACTIVE then
                for _, obj in ipairs(mission.objectives) do
                    if obj.type == 'protect_asset' and mission.participants[victimAwid] then
                        obj.alive = false
                        MissionManager.FailMission(missionId, 'Protected asset was destroyed')
                    end
                end
            end
        end
    end
end

--- Handle zone captured for mission objectives
---@param data table
local function onZoneCaptured(data)
    if not data or not data.zone_id then return end

    for missionId, mission in pairs(activeMissions) do
        if mission.state == MISSION_STATE.ACTIVE then
            for _, obj in ipairs(mission.objectives) do
                if obj.type == 'destroy_base' and obj.zone_id == data.zone_id then
                    obj.complete = true
                    checkObjectives(missionId)
                end
            end
        end
    end
end

--- Handle base destroyed for SEAD missions
---@param data table
local function onBaseDestroyed(data)
    if not data or not data.zone_id then return end

    for missionId, mission in pairs(activeMissions) do
        if mission.state == MISSION_STATE.ACTIVE and mission.type == 'sead' then
            for _, obj in ipairs(mission.objectives) do
                if obj.type == 'destroy_radar' and obj.zone_id == data.zone_id then
                    obj.current = (obj.current or 0) + 1
                    checkObjectives(missionId)
                end
            end
        end
    end
end

-- ============================================================
-- PERSISTENCE
-- ============================================================

--- Save completed/failed mission to aw_missions_history
---@param mission table
function saveMissionHistory(mission)
    if not CoreDatabase then return end

    local participantList = {}
    for awid, _ in pairs(mission.participants) do
        participantList[#participantList + 1] = awid
    end

    CoreDatabase.Execute([[
        INSERT INTO aw_missions_history (mission_type, faction, state, difficulty, zone_id, participants, rewards, created_at, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ]], {
        mission.type,
        mission.faction,
        mission.state,
        mission.difficulty,
        mission.zone_id,
        json.encode(participantList),
        json.encode(mission.rewards),
        mission.created_at,
        GetGameTimer(),
    })
end

-- ============================================================
-- QUERY EXPORTS
-- ============================================================

--- Get all active missions (optionally filtered by faction)
---@param faction string|nil
---@return table missions
function MissionManager.GetActiveMissions(faction)
    local result = {}
    for id, mission in pairs(activeMissions) do
        if not faction or mission.faction == faction then
            result[#result + 1] = {
                id           = id,
                type         = mission.type,
                faction      = mission.faction,
                state        = mission.state,
                difficulty   = mission.difficulty,
                zone_id      = mission.zone_id,
                display_name = mission.display_name,
                objectives   = mission.objectives,
                rewards      = mission.rewards,
            }
        end
    end
    return result
end

--- Get a specific mission
---@param missionId number
---@return table|nil
function MissionManager.GetMission(missionId)
    return activeMissions[missionId]
end

--- Get missions a player is in
---@param awid string
---@return table missionIds
function MissionManager.GetPlayerMissions(awid)
    local result = {}
    if playerMissions[awid] then
        for missionId, _ in pairs(playerMissions[awid]) do
            result[#result + 1] = missionId
        end
    end
    return result
end

-- ============================================================
-- EVENT HANDLERS
-- ============================================================

AddEventHandler(AW.EVENT.KILL, function(data)
    onKill(data)
end)

AddEventHandler(AW.EVENT.ZONE_CAPTURED, function(data)
    onZoneCaptured(data)
end)

AddEventHandler(AW.EVENT.BASE_DESTROYED, function(data)
    onBaseDestroyed(data)
end)

--- Player dropped — remove from missions
AddEventHandler(AW.EVENT.PLAYER_DROPPED, function(data)
    if not data or not data.awid then return end
    local awid = data.awid

    if playerMissions[awid] then
        for missionId, _ in pairs(playerMissions[awid]) do
            MissionManager.LeaveMission(awid, missionId)
        end
        playerMissions[awid] = nil
    end
end)

--- War reset — cancel all missions
AddEventHandler(AW.EVENT.WAR_RESET, function()
    for missionId, _ in pairs(activeMissions) do
        expireMission(missionId)
    end
    activeMissions = {}
    playerMissions = {}
    nextMissionId = 1
end)

--- Client requests to join mission
RegisterNetEvent('aw:mission:request_join')
AddEventHandler('aw:mission:request_join', function(data)
    local source = source
    local awid = CoreIdentity and CoreIdentity.GetAWID(source)
    if not awid or not data or not data.mission_id then return end

    local ok, err = MissionManager.JoinMission(awid, data.mission_id)
    TriggerClientEvent('aw:mission:join_result', source, { ok = ok, error = err, mission_id = data.mission_id })
end)

--- Client requests to leave mission
RegisterNetEvent('aw:mission:request_leave')
AddEventHandler('aw:mission:request_leave', function(data)
    local source = source
    local awid = CoreIdentity and CoreIdentity.GetAWID(source)
    if not awid or not data or not data.mission_id then return end

    MissionManager.LeaveMission(awid, data.mission_id)
end)

-- ============================================================
-- PERIODIC TASKS
-- ============================================================

-- Mission tick: every 2 seconds — check briefing timeouts, time limits, hold objectives
CreateThread(function()
    while true do
        Wait(2000)
        if not initialized then goto continue end

        local now = GetGameTimer()

        for missionId, mission in pairs(activeMissions) do
            -- Briefing timeout → activate
            if mission.state == MISSION_STATE.BRIEFING and now >= mission.briefing_ends then
                activateMission(missionId)
            end

            -- Active timeout → fail
            if mission.state == MISSION_STATE.ACTIVE and mission.started_at then
                if (now - mission.started_at) >= mission.time_limit then
                    MissionManager.FailMission(missionId, 'Time limit expired')
                end
            end

            -- Hold zone objective tick
            if mission.state == MISSION_STATE.ACTIVE then
                for _, obj in ipairs(mission.objectives) do
                    if obj.type == 'hold_zone' and not obj.complete then
                        -- Check if faction still holds the zone
                        local zoneOwner = exports['aw-world']:GetZoneOwner(obj.zone_id)
                        if zoneOwner == mission.faction then
                            obj.elapsed = (obj.elapsed or 0) + 2
                            if obj.elapsed >= obj.duration then
                                obj.complete = true
                                checkObjectives(missionId)
                            end
                        else
                            -- Zone lost — fail the defense mission
                            MissionManager.FailMission(missionId, 'Zone lost to enemy')
                        end
                    end
                end
            end
        end

        ::continue::
    end
end)

-- Auto-generate missions periodically: every 3-5 minutes
CreateThread(function()
    while true do
        Wait(math.random(180000, 300000)) -- 3-5 min
        if not initialized then goto skip end

        -- Count active missions
        local count = 0
        for _ in pairs(activeMissions) do count = count + 1 end

        -- Generate if fewer than 3 active
        if count < 3 then
            MissionManager.GenerateMission()
        end

        ::skip::
    end
end)

-- ============================================================
-- INITIALIZATION
-- ============================================================

AddEventHandler(AW.EVENT.CORE_READY, function()
    if initialized then return end
    initialized = true

    -- Load mission templates from config
    if CoreRegistry then
        local templates = CoreRegistry.GetAll('mission')
        if templates then
            for id, tpl in pairs(templates) do
                missionTemplates[id] = tpl
            end
        end
    end

    -- Create history table
    if CoreDatabase then
        CoreDatabase.Execute([[
            CREATE TABLE IF NOT EXISTS aw_missions_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                mission_type VARCHAR(64),
                faction VARCHAR(32),
                state VARCHAR(32),
                difficulty INT DEFAULT 1,
                zone_id VARCHAR(64),
                participants JSON,
                rewards JSON,
                created_at BIGINT,
                completed_at BIGINT
            )
        ]])
    end

    if CoreAPI and CoreAPI.RegisterModule then
        CoreAPI.RegisterModule({
            name     = 'aw-mission',
            version  = '1.0.0',
            priority = 500,
        })
    end

    CoreLogger.Info('aw-mission', 'Mission system initialized')
end)

-- ============================================================
-- EXPORTS REGISTRATION
-- ============================================================

exports('GetActiveMissions', function(...) return MissionManager.GetActiveMissions(...) end)
exports('GetMission',        function(...) return MissionManager.GetMission(...) end)
exports('JoinMission',       function(...) return MissionManager.JoinMission(...) end)
exports('LeaveMission',      function(...) return MissionManager.LeaveMission(...) end)
exports('GetPlayerMissions', function(...) return MissionManager.GetPlayerMissions(...) end)
exports('GenerateMission',   function(...) return MissionManager.GenerateMission(...) end)
exports('CompleteMission',   function(...) return MissionManager.CompleteMission(...) end)
exports('FailMission',       function(...) return MissionManager.FailMission(...) end)
