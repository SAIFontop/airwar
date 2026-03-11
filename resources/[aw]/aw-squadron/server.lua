--[[
    aw-squadron — Server-side Squadron & Formation System
    
    Responsibilities:
    1. Squadron creation and management (2-6 pilots)
    2. Squadron leader can set waypoints, request missions, issue orders
    3. Formation system (echelon, line abreast, column, diamond)
    4. Squad mission bonuses
    5. Persistent squad storage in DB
]]

-- ============================================================
-- MODULE STATE
-- ============================================================

local SquadronManager = {}
local initialized = false

-- Active squadrons: squadId → { ... }
local squadrons = {}

-- Player to squad mapping: awid → squadId
local playerSquadrons = {}

-- Squadron ID counter
local nextSquadId = 1

-- Formation types
local FORMATIONS = {
    echelon       = { display = 'Echelon Right',  positions = { {30, -30}, {60, -60}, {90, -90}, {120, -120}, {150, -150} } },
    echelon_left  = { display = 'Echelon Left',   positions = { {-30, -30}, {-60, -60}, {-90, -90}, {-120, -120}, {-150, -150} } },
    line_abreast  = { display = 'Line Abreast',   positions = { {-40, 0}, {40, 0}, {-80, 0}, {80, 0}, {-120, 0} } },
    column        = { display = 'Column',         positions = { {0, -50}, {0, -100}, {0, -150}, {0, -200}, {0, -250} } },
    diamond       = { display = 'Diamond',        positions = { {-30, -30}, {30, -30}, {0, -60}, {-30, -90}, {30, -90} } },
    finger_four   = { display = 'Finger Four',    positions = { {-30, -20}, {30, -20}, {60, -40}, {-60, -40}, {0, -60} } },
}

-- ============================================================
-- SQUADRON LIFECYCLE
-- ============================================================

--- Generate unique squadron ID
---@return string
local function generateSquadId()
    local id = ('SQ-%04d'):format(nextSquadId)
    nextSquadId = nextSquadId + 1
    return id
end

--- Create a new squadron
---@param leaderAwid string
---@param leaderSource number
---@param name string|nil
---@return string|nil squadId
---@return string|nil error
function SquadronManager.CreateSquadron(leaderAwid, leaderSource, name)
    -- Already in a squad?
    if playerSquadrons[leaderAwid] then
        return nil, 'Already in a squadron'
    end

    -- Check faction
    local faction = exports['aw-faction']:GetFaction(leaderAwid)
    if not faction then
        return nil, 'Must be in a faction'
    end

    local squadId = generateSquadId()
    local displayName = name or (squadId .. ' Squadron')

    squadrons[squadId] = {
        id          = squadId,
        name        = displayName,
        leader      = leaderAwid,
        faction     = faction,
        formation   = 'finger_four',
        members     = {
            [leaderAwid] = {
                awid   = leaderAwid,
                source = leaderSource,
                slot   = 1, -- Leader is slot 1
            }
        },
        member_count = 1,
        max_members  = 6,
        created_at   = os.time(),
        waypoint     = nil,
    }

    playerSquadrons[leaderAwid] = squadId

    -- Persist
    SquadronManager.SaveSquadron(squadId)

    TriggerEvent(AW.EVENT.SQUADRON_CREATED, {
        squad_id = squadId,
        name     = displayName,
        leader   = leaderAwid,
        faction  = faction,
    })

    -- Notify leader
    TriggerClientEvent('aw:squadron:joined', leaderSource, {
        squad_id  = squadId,
        name      = displayName,
        is_leader = true,
        formation = 'finger_four',
        slot      = 1,
    })

    CoreLogger.Info('aw-squadron', 'Squadron %s created by %s', squadId, leaderAwid)
    return squadId, nil
end

--- Disband a squadron
---@param squadId string
---@param requesterAwid string|nil
---@return boolean success
function SquadronManager.DisbandSquadron(squadId, requesterAwid)
    local squad = squadrons[squadId]
    if not squad then return false end

    -- Only leader or admin can disband
    if requesterAwid and squad.leader ~= requesterAwid then
        return false
    end

    -- Notify all members
    for awid, member in pairs(squad.members) do
        playerSquadrons[awid] = nil
        if member.source then
            TriggerClientEvent('aw:squadron:disbanded', member.source, { squad_id = squadId })
        end
    end

    TriggerEvent(AW.EVENT.SQUADRON_DISBANDED, {
        squad_id = squadId,
        name     = squad.name,
    })

    -- Remove from DB
    if MySQL then
        MySQL.Async.execute(
            'DELETE FROM ' .. AW.TABLE.SQUADRONS .. ' WHERE squad_id = ?',
            { squadId }
        )
    end

    squadrons[squadId] = nil

    CoreLogger.Info('aw-squadron', 'Squadron %s disbanded', squadId)
    return true
end

--- Join an existing squadron
---@param awid string
---@param source number
---@param squadId string
---@return boolean success
---@return string|nil error
function SquadronManager.JoinSquadron(awid, source, squadId)
    if playerSquadrons[awid] then
        return false, 'Already in a squadron'
    end

    local squad = squadrons[squadId]
    if not squad then
        return false, 'Squadron not found'
    end

    if squad.member_count >= squad.max_members then
        return false, 'Squadron is full'
    end

    -- Must be same faction
    local faction = exports['aw-faction']:GetFaction(awid)
    if faction ~= squad.faction then
        return false, 'Wrong faction'
    end

    local slot = squad.member_count + 1
    squad.members[awid] = {
        awid   = awid,
        source = source,
        slot   = slot,
    }
    squad.member_count = squad.member_count + 1
    playerSquadrons[awid] = squadId

    SquadronManager.SaveSquadron(squadId)

    TriggerEvent(AW.EVENT.SQUADRON_MEMBER_JOINED, {
        squad_id = squadId,
        awid     = awid,
        slot     = slot,
    })

    -- Notify the new member
    TriggerClientEvent('aw:squadron:joined', source, {
        squad_id  = squadId,
        name      = squad.name,
        is_leader = false,
        formation = squad.formation,
        slot      = slot,
    })

    -- Notify existing members
    for memberAwid, member in pairs(squad.members) do
        if memberAwid ~= awid and member.source then
            TriggerClientEvent('aw:squadron:member_update', member.source, {
                action = 'joined',
                awid   = awid,
                slot   = slot,
            })
        end
    end

    return true, nil
end

--- Leave a squadron
---@param awid string
---@return boolean success
function SquadronManager.LeaveSquadron(awid)
    local squadId = playerSquadrons[awid]
    if not squadId then return false end

    local squad = squadrons[squadId]
    if not squad then
        playerSquadrons[awid] = nil
        return false
    end

    -- If leader leaves, promote next member or disband
    if squad.leader == awid then
        local newLeader = nil
        for memberAwid, _ in pairs(squad.members) do
            if memberAwid ~= awid then
                newLeader = memberAwid
                break
            end
        end

        if newLeader then
            squad.leader = newLeader
            squad.members[newLeader].slot = 1
            -- Notify new leader
            if squad.members[newLeader].source then
                TriggerClientEvent('aw:squadron:promoted', squad.members[newLeader].source, {
                    squad_id = squadId,
                })
            end
        else
            -- No members left, disband
            return SquadronManager.DisbandSquadron(squadId)
        end
    end

    local memberSource = squad.members[awid] and squad.members[awid].source
    squad.members[awid] = nil
    squad.member_count = math.max(0, squad.member_count - 1)
    playerSquadrons[awid] = nil

    SquadronManager.SaveSquadron(squadId)

    TriggerEvent(AW.EVENT.SQUADRON_MEMBER_LEFT, {
        squad_id = squadId,
        awid     = awid,
    })

    -- Notify the leaver
    if memberSource then
        TriggerClientEvent('aw:squadron:left', memberSource, { squad_id = squadId })
    end

    -- Notify remaining members
    for _, member in pairs(squad.members) do
        if member.source then
            TriggerClientEvent('aw:squadron:member_update', member.source, {
                action = 'left',
                awid   = awid,
            })
        end
    end

    return true
end

-- ============================================================
-- QUERY API
-- ============================================================

--- Get squadron data
---@param squadId string
---@return table|nil
function SquadronManager.GetSquadron(squadId)
    return squadrons[squadId]
end

--- Get player's current squadron ID
---@param awid string
---@return string|nil
function SquadronManager.GetPlayerSquadron(awid)
    return playerSquadrons[awid]
end

--- Get squadron members
---@param squadId string
---@return table
function SquadronManager.GetSquadronMembers(squadId)
    if squadrons[squadId] then
        return squadrons[squadId].members
    end
    return {}
end

--- Set formation for a squadron
---@param squadId string
---@param formation string
---@param requesterAwid string
---@return boolean success
function SquadronManager.SetFormation(squadId, formation, requesterAwid)
    local squad = squadrons[squadId]
    if not squad then return false end

    -- Only leader can set formation
    if squad.leader ~= requesterAwid then return false end

    if not FORMATIONS[formation] then return false end

    squad.formation = formation

    -- Notify all members
    for _, member in pairs(squad.members) do
        if member.source then
            TriggerClientEvent('aw:squadron:formation_changed', member.source, {
                formation = formation,
                display   = FORMATIONS[formation].display,
                positions = FORMATIONS[formation].positions,
                slot      = member.slot,
            })
        end
    end

    TriggerEvent(AW.EVENT.SQUADRON_ORDER_ISSUED, {
        squad_id = squadId,
        order    = 'formation',
        value    = formation,
    })

    return true
end

-- ============================================================
-- PERSISTENCE
-- ============================================================

--- Save squadron to DB
---@param squadId string
function SquadronManager.SaveSquadron(squadId)
    local squad = squadrons[squadId]
    if not squad or not MySQL then return end

    local memberList = {}
    for awid, _ in pairs(squad.members) do
        memberList[#memberList + 1] = awid
    end

    MySQL.Async.execute(
        'INSERT INTO ' .. AW.TABLE.SQUADRONS .. ' (squad_id, name, leader, faction, formation, members, created_at) '
        .. 'VALUES (?, ?, ?, ?, ?, ?, FROM_UNIXTIME(?)) '
        .. 'ON DUPLICATE KEY UPDATE leader = ?, formation = ?, members = ?',
        {
            squadId, squad.name, squad.leader, squad.faction, squad.formation,
            json.encode(memberList), squad.created_at,
            squad.leader, squad.formation, json.encode(memberList)
        }
    )
end

--- Load persistent squadrons from DB
local function loadSquadrons()
    if not MySQL then return end

    local rows = MySQL.Sync.fetchAll(
        'SELECT squad_id, name, leader, faction, formation, members, UNIX_TIMESTAMP(created_at) as created_at FROM ' .. AW.TABLE.SQUADRONS,
        {}
    )

    if rows then
        for _, row in ipairs(rows) do
            local members = json.decode(row.members or '[]') or {}
            local memberTable = {}
            local count = 0

            for i, awid in ipairs(members) do
                memberTable[awid] = {
                    awid   = awid,
                    source = nil, -- Will be set when player connects
                    slot   = i,
                }
                playerSquadrons[awid] = row.squad_id
                count = count + 1
            end

            squadrons[row.squad_id] = {
                id           = row.squad_id,
                name         = row.name,
                leader       = row.leader,
                faction      = row.faction,
                formation    = row.formation or 'finger_four',
                members      = memberTable,
                member_count = count,
                max_members  = 6,
                created_at   = row.created_at or os.time(),
                waypoint     = nil,
            }

            -- Update next ID
            local num = tonumber(row.squad_id:match('SQ%-(%d+)'))
            if num and num >= nextSquadId then
                nextSquadId = num + 1
            end
        end
    end
end

-- ============================================================
-- EVENT HANDLERS
-- ============================================================

--- Player loaded — update source in existing squad
AddEventHandler(AW.EVENT.PLAYER_LOADED, function(data)
    if not data or not data.awid then return end

    local squadId = playerSquadrons[data.awid]
    if squadId and squadrons[squadId] and squadrons[squadId].members[data.awid] then
        squadrons[squadId].members[data.awid].source = data.source

        -- Sync squad state
        local squad = squadrons[squadId]
        TriggerClientEvent('aw:squadron:joined', data.source, {
            squad_id  = squadId,
            name      = squad.name,
            is_leader = squad.leader == data.awid,
            formation = squad.formation,
            slot      = squad.members[data.awid].slot,
        })
    end
end)

--- Player dropped — clear source, don't remove from squad (persistent)
AddEventHandler(AW.EVENT.PLAYER_DROPPED, function(data)
    if not data or not data.awid then return end

    local squadId = playerSquadrons[data.awid]
    if squadId and squadrons[squadId] and squadrons[squadId].members[data.awid] then
        squadrons[squadId].members[data.awid].source = nil
    end
end)

--- Mission completed — apply squad bonus
AddEventHandler(AW.EVENT.MISSION_COMPLETED, function(data)
    if not data or not data.participants then return end

    -- Check if multiple participants are from the same squad
    local squadParticipants = {}
    for _, awid in ipairs(data.participants) do
        local squadId = playerSquadrons[awid]
        if squadId then
            if not squadParticipants[squadId] then
                squadParticipants[squadId] = {}
            end
            squadParticipants[squadId][#squadParticipants[squadId] + 1] = awid
        end
    end

    -- Award 25% bonus if 2+ squad members participated
    for _, members in pairs(squadParticipants) do
        if #members >= 2 then
            local bonus = math.floor((data.reward or 500) * 0.25)
            for _, awid in ipairs(members) do
                exports['aw-store']:AddBalance(awid, bonus, 'squad_bonus', {
                    mission_type = data.mission_type,
                })
            end
        end
    end
end)

--- War reset — disband all squadrons
AddEventHandler(AW.EVENT.WAR_RESET, function()
    local ids = {}
    for id, _ in pairs(squadrons) do
        ids[#ids + 1] = id
    end
    for _, id in ipairs(ids) do
        SquadronManager.DisbandSquadron(id)
    end
end)

-- ============================================================
-- INITIALIZATION
-- ============================================================

AddEventHandler(AW.EVENT.CORE_READY, function()
    if initialized then return end
    initialized = true

    loadSquadrons()

    if CoreAPI and CoreAPI.RegisterModule then
        CoreAPI.RegisterModule({
            name     = 'aw-squadron',
            version  = '1.0.0',
            priority = 300,
        })
    end

    CoreLogger.Info('aw-squadron', 'Squadron module initialized — %d persistent squads loaded', Utils.TableCount(squadrons))
end)

-- ============================================================
-- EXPORTS
-- ============================================================

exports('CreateSquadron',      function(...) return SquadronManager.CreateSquadron(...) end)
exports('DisbandSquadron',     function(...) return SquadronManager.DisbandSquadron(...) end)
exports('JoinSquadron',        function(...) return SquadronManager.JoinSquadron(...) end)
exports('LeaveSquadron',       function(...) return SquadronManager.LeaveSquadron(...) end)
exports('GetSquadron',         function(...) return SquadronManager.GetSquadron(...) end)
exports('GetPlayerSquadron',   function(...) return SquadronManager.GetPlayerSquadron(...) end)
exports('SetFormation',        function(...) return SquadronManager.SetFormation(...) end)
exports('GetSquadronMembers',  function(...) return SquadronManager.GetSquadronMembers(...) end)
