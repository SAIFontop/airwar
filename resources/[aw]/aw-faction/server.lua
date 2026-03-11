--[[
    aw-faction — Server-side Faction Management
    
    Responsibilities:
    1. Assign players to factions (returning → same, new → underdog)
    2. Track per-faction runtime state (online count, score, zones)
    3. Faction balancing (prevent 2x population imbalance)
    4. Provide faction data to all modules
    5. Persist faction assignment in DB
]]

-- ============================================================
-- MODULE STATE
-- ============================================================

local FactionManager = {}
local initialized = false

-- Runtime faction state: factionId → { ... }
local factionState = {}

-- Player to faction mapping: awid → factionId
local playerFactions = {}

-- Faction definitions from config
local factionDefs = {}

-- ============================================================
-- HELPERS
-- ============================================================

--- Initialize runtime state for all factions from config
local function initFactionState()
    factionDefs = {}
    if CoreRegistry then
        local all = CoreRegistry.GetAll('faction')
        if all then
            for id, def in pairs(all) do
                factionDefs[id] = def
                factionState[id] = {
                    id              = id,
                    display         = def.display,
                    color           = def.color,
                    online_count    = 0,
                    max_players     = def.max_players or 32,
                    score           = 0,
                    zones_held      = 0,
                    online_members  = {}, -- awid → source
                }
            end
        end
    end
end

--- Find the faction with the fewest online players (underdog)
---@return string|nil factionId
local function findUnderdogFaction()
    local minCount = math.huge
    local candidates = {}

    for id, state in pairs(factionState) do
        -- Skip freelancers for auto-assign (they opt in)
        if id == 'freelancers' then goto continue end
        if state.online_count < state.max_players then
            if state.online_count < minCount then
                minCount = state.online_count
                candidates = { id }
            elseif state.online_count == minCount then
                candidates[#candidates + 1] = id
            end
        end
        ::continue::
    end

    if #candidates == 0 then return nil end
    return candidates[math.random(#candidates)]
end

--- Check if faction is full
---@param factionId string
---@return boolean
local function isFactionFull(factionId)
    local state = factionState[factionId]
    if not state then return true end
    return state.online_count >= state.max_players
end

--- Load player's previous faction from DB
---@param awid string
---@return string|nil factionId
local function loadPreviousFaction(awid)
    if not MySQL then return nil end

    local rows = MySQL.Sync.fetchAll(
        'SELECT faction_id FROM ' .. AW.TABLE.FACTIONS_DATA .. ' WHERE awid = ? LIMIT 1',
        { awid }
    )

    if rows and #rows > 0 then
        return rows[1].faction_id
    end
    return nil
end

--- Save faction assignment to DB
---@param awid string
---@param factionId string
local function saveFactionAssignment(awid, factionId)
    if not MySQL then return end

    MySQL.Async.execute(
        'INSERT INTO ' .. AW.TABLE.FACTIONS_DATA .. ' (awid, faction_id, joined_at) VALUES (?, ?, NOW()) '
        .. 'ON DUPLICATE KEY UPDATE faction_id = ?, joined_at = NOW()',
        { awid, factionId, factionId }
    )
end

-- ============================================================
-- FACTION ASSIGNMENT
-- ============================================================

--- Assign a player to a faction
---@param awid string Player AWID
---@param source number Player server ID
---@param requestedFaction string|nil Optional faction preference
---@return string|nil factionId
---@return string|nil error
function FactionManager.AssignFaction(awid, source, requestedFaction)
    -- Already assigned?
    if playerFactions[awid] then
        return playerFactions[awid], nil
    end

    local targetFaction = nil

    -- Check for previous faction
    local previous = loadPreviousFaction(awid)
    if previous and factionState[previous] and not isFactionFull(previous) then
        targetFaction = previous
    end

    -- Player requested a specific faction
    if not targetFaction and requestedFaction then
        if factionState[requestedFaction] and not isFactionFull(requestedFaction) then
            -- Check balance: don't allow if this faction already has 50% more than smallest
            local smallest = math.huge
            for id, state in pairs(factionState) do
                if id ~= 'freelancers' and state.online_count < smallest then
                    smallest = state.online_count
                end
            end
            local requested = factionState[requestedFaction].online_count
            if smallest == 0 or requested < smallest * 1.5 then
                targetFaction = requestedFaction
            end
        end
    end

    -- Auto-assign to underdog
    if not targetFaction then
        targetFaction = findUnderdogFaction()
    end

    if not targetFaction then
        return nil, 'All factions are full'
    end

    -- Assign
    playerFactions[awid] = targetFaction
    factionState[targetFaction].online_count = factionState[targetFaction].online_count + 1
    factionState[targetFaction].online_members[awid] = source

    -- Persist
    saveFactionAssignment(awid, targetFaction)

    -- Broadcast
    TriggerEvent(AW.EVENT.FACTION_ASSIGNED, {
        awid       = awid,
        source     = source,
        faction_id = targetFaction,
        display    = factionState[targetFaction].display,
        color      = factionState[targetFaction].color,
    })

    -- Notify client
    TriggerClientEvent(AW.EVENT.FACTION_ASSIGNED, source, {
        faction_id = targetFaction,
        display    = factionState[targetFaction].display,
        color      = factionState[targetFaction].color,
    })

    CoreLogger.Info('aw-faction', 'Assigned %s → %s (%s)', awid, targetFaction, factionState[targetFaction].display)
    return targetFaction, nil
end

--- Remove player from their faction
---@param awid string Player AWID
---@return boolean success
function FactionManager.LeaveFaction(awid)
    local factionId = playerFactions[awid]
    if not factionId then return false end

    playerFactions[awid] = nil

    if factionState[factionId] then
        factionState[factionId].online_count = math.max(0, factionState[factionId].online_count - 1)
        factionState[factionId].online_members[awid] = nil
    end

    return true
end

-- ============================================================
-- QUERY API
-- ============================================================

--- Get a player's faction ID
---@param awid string Player AWID
---@return string|nil factionId
function FactionManager.GetFaction(awid)
    return playerFactions[awid]
end

--- Get online members of a faction
---@param factionId string
---@return table { awid → source }
function FactionManager.GetFactionMembers(factionId)
    if factionState[factionId] then
        return factionState[factionId].online_members
    end
    return {}
end

--- Get all faction states
---@return table factionId → state
function FactionManager.GetAllFactions()
    return factionState
end

--- Get faction score
---@param factionId string
---@return number score
function FactionManager.GetFactionScore(factionId)
    if factionState[factionId] then
        return factionState[factionId].score
    end
    return 0
end

--- Add score to a faction
---@param factionId string
---@param amount number
function FactionManager.AddFactionScore(factionId, amount)
    if not factionState[factionId] then return end

    factionState[factionId].score = factionState[factionId].score + amount

    TriggerEvent(AW.EVENT.FACTION_SCORE_CHANGED, {
        faction_id = factionId,
        new_score  = factionState[factionId].score,
        delta      = amount,
    })
end

--- Get online count for a faction
---@param factionId string
---@return number
function FactionManager.GetFactionOnlineCount(factionId)
    if factionState[factionId] then
        return factionState[factionId].online_count
    end
    return 0
end

-- ============================================================
-- EVENT HANDLERS
-- ============================================================

--- Player loaded — auto-assign faction
AddEventHandler(AW.EVENT.PLAYER_LOADED, function(data)
    if not data or not data.awid then return end
    FactionManager.AssignFaction(data.awid, data.source)
end)

--- Player disconnected — update counts
AddEventHandler(AW.EVENT.PLAYER_DROPPED, function(data)
    if not data or not data.awid then return end
    FactionManager.LeaveFaction(data.awid)
end)

--- Kill event — add score to killer's faction
AddEventHandler(AW.EVENT.KILL, function(data)
    if not data or not data.attacker_awid then return end
    local factionId = playerFactions[data.attacker_awid]
    if factionId then
        FactionManager.AddFactionScore(factionId, 10)
    end
end)

--- Mission completed — add score
AddEventHandler(AW.EVENT.MISSION_COMPLETED, function(data)
    if data and data.faction then
        FactionManager.AddFactionScore(data.faction, data.score or 50)
    end
end)

--- Zone captured — add score and update zones held
AddEventHandler(AW.EVENT.ZONE_CAPTURED, function(data)
    if data and data.faction then
        FactionManager.AddFactionScore(data.faction, 100)

        -- Update zones held count
        if factionState[data.faction] then
            factionState[data.faction].zones_held = factionState[data.faction].zones_held + 1
        end
        -- Decrement old owner
        if data.previous_owner and factionState[data.previous_owner] then
            factionState[data.previous_owner].zones_held = math.max(0, factionState[data.previous_owner].zones_held - 1)
        end
    end
end)

--- War reset — reset faction scores
AddEventHandler(AW.EVENT.WAR_RESET, function()
    for _, state in pairs(factionState) do
        state.score = 0
        state.zones_held = 0
    end
end)

-- ============================================================
-- INITIALIZATION
-- ============================================================

AddEventHandler(AW.EVENT.CORE_READY, function()
    if initialized then return end
    initialized = true

    initFactionState()

    if CoreAPI and CoreAPI.RegisterModule then
        CoreAPI.RegisterModule({
            name     = 'aw-faction',
            version  = '1.0.0',
            priority = 200,
        })
    end

    CoreLogger.Info('aw-faction', 'Faction module initialized — %d factions loaded', Utils.TableCount(factionDefs))
end)

-- ============================================================
-- EXPORTS
-- ============================================================

exports('GetFaction',           function(...) return FactionManager.GetFaction(...) end)
exports('GetFactionMembers',    function(...) return FactionManager.GetFactionMembers(...) end)
exports('GetAllFactions',       function(...) return FactionManager.GetAllFactions(...) end)
exports('AssignFaction',        function(...) return FactionManager.AssignFaction(...) end)
exports('LeaveFaction',         function(...) return FactionManager.LeaveFaction(...) end)
exports('GetFactionScore',      function(...) return FactionManager.GetFactionScore(...) end)
exports('AddFactionScore',      function(...) return FactionManager.AddFactionScore(...) end)
exports('GetFactionOnlineCount', function(...) return FactionManager.GetFactionOnlineCount(...) end)
