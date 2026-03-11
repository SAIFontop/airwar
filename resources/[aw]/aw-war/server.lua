--[[
    aw-war — Server-side War State Machine
    
    Responsibilities:
    1. Track global war state and phases
    2. Phase transitions: ceasefire → buildup → active_war → decisive → victory
    3. Victory conditions (territory %, score threshold, HQ destruction)
    4. War reset after victory
    5. Broadcast war state to all modules and UI
]]

-- ============================================================
-- MODULE STATE
-- ============================================================

local WarManager = {}
local initialized = false

-- War phases
local PHASE = {
    CEASEFIRE = 'ceasefire',    -- No combat, setup
    BUILDUP   = 'buildup',     -- Limited combat, missions available
    ACTIVE    = 'active_war',  -- Full warfare
    DECISIVE  = 'decisive',    -- Near victory threshold
    VICTORY   = 'victory',     -- A faction has won
}

-- Current war state
local warState = {
    phase           = PHASE.CEASEFIRE,
    phase_started   = 0,
    round           = 1,
    started_at      = 0,
    victory_faction = nil,
    scores          = {},      -- faction_id → cumulative war score
    territory       = {},      -- faction_id → zone count
}

-- Configuration
local warConfig = {
    ceasefire_duration  = 120,   -- seconds
    buildup_duration    = 300,   -- seconds (auto-advance to active)
    victory_territory   = 0.75,  -- 75% of zones
    victory_score       = 5000,  -- score threshold
    victory_hold_time   = 300,   -- seconds to hold territory for victory
    victory_celebration = 60,    -- seconds of celebration before reset
    decisive_threshold  = 0.60,  -- 60% triggers decisive phase
}

-- Victory tracking
local victoryTracking = {
    leading_faction     = nil,
    hold_start          = nil,  -- when leading faction first reached threshold
}

-- ============================================================
-- PHASE TRANSITIONS
-- ============================================================

--- Set war phase
---@param newPhase string
---@param force boolean|nil
function WarManager.SetWarPhase(newPhase, force)
    local oldPhase = warState.phase

    if oldPhase == newPhase and not force then return end

    warState.phase = newPhase
    warState.phase_started = GetGameTimer()

    -- Emit phase change
    TriggerEvent(AW.EVENT.WAR_PHASE_CHANGED, {
        old_phase = oldPhase,
        new_phase = newPhase,
        round     = warState.round,
    })

    -- Broadcast to all clients
    TriggerClientEvent('aw:war:phase_changed', -1, {
        phase       = newPhase,
        old_phase   = oldPhase,
        round       = warState.round,
    })

    CoreLogger.Info('aw-war', ('War phase: %s → %s (Round %d)'):format(oldPhase, newPhase, warState.round))

    -- Phase-specific actions
    if newPhase == PHASE.VICTORY then
        onVictory()
    end
end

--- Process victory
local function onVictory()
    local winner = victoryTracking.leading_faction

    warState.victory_faction = winner

    TriggerEvent(AW.EVENT.WAR_ENDED, {
        winner = winner,
        round  = warState.round,
        scores = warState.scores,
    })

    TriggerClientEvent('aw:war:victory', -1, {
        winner = winner,
        round  = warState.round,
        scores = warState.scores,
    })

    CoreLogger.Info('aw-war', ('WAR VICTORY: %s wins Round %d!'):format(winner or 'unknown', warState.round))

    -- Schedule war reset after celebration
    SetTimeout(warConfig.victory_celebration * 1000, function()
        WarManager.ResetWar()
    end)
end

-- Make onVictory accessible to SetWarPhase
_G.onVictory = onVictory  -- temp forward ref fix
-- Actually just inline it above; Lua local ordering handled by defining before use.

--- Reset war for a new round
function WarManager.ResetWar()
    warState.round = warState.round + 1
    warState.victory_faction = nil
    warState.scores = {}
    warState.territory = {}
    warState.started_at = GetGameTimer()

    victoryTracking.leading_faction = nil
    victoryTracking.hold_start = nil

    -- Emit reset
    TriggerEvent(AW.EVENT.WAR_RESET, {
        round = warState.round,
    })

    TriggerClientEvent('aw:war:reset', -1, {
        round = warState.round,
    })

    CoreLogger.Info('aw-war', ('War reset — starting Round %d'):format(warState.round))

    -- Begin ceasefire for new round
    WarManager.SetWarPhase(PHASE.CEASEFIRE, true)

    -- Save state
    saveWarState()
end

-- ============================================================
-- SCORE & TERRITORY TRACKING
-- ============================================================

--- Update faction scores from events
local function updateScores()
    local factions = exports['aw-faction']:GetAllFactions()
    if not factions then return end

    for _, f in ipairs(factions) do
        warState.scores[f.id] = exports['aw-faction']:GetFactionScore(f.id) or 0
    end
end

--- Update territory counts
local function updateTerritory()
    local zones = exports['aw-world']:GetAllZones()
    if not zones then return end

    -- Reset counts
    for fid, _ in pairs(warState.territory) do
        warState.territory[fid] = 0
    end

    local totalZones = 0
    for _, zone in pairs(zones) do
        totalZones = totalZones + 1
        if zone.owner then
            warState.territory[zone.owner] = (warState.territory[zone.owner] or 0) + 1
        end
    end

    warState.total_zones = totalZones
end

--- Get victory progress for each faction
---@return table { faction_id → { territory_pct, score, score_pct } }
function WarManager.GetVictoryProgress()
    local progress = {}
    local totalZones = warState.total_zones or 1

    for fid, zoneCount in pairs(warState.territory) do
        local territoryPct = zoneCount / math.max(totalZones, 1)
        local score = warState.scores[fid] or 0

        progress[fid] = {
            territory_pct = territoryPct,
            zone_count    = zoneCount,
            score         = score,
            score_pct     = score / math.max(warConfig.victory_score, 1),
        }
    end

    return progress
end

-- ============================================================
-- VICTORY CONDITION CHECK
-- ============================================================

local function checkVictoryConditions()
    if warState.phase == PHASE.VICTORY or warState.phase == PHASE.CEASEFIRE then return end

    local totalZones = warState.total_zones or 0
    if totalZones == 0 then return end

    local now = GetGameTimer()

    -- Check each faction
    for fid, zoneCount in pairs(warState.territory) do
        local territoryPct = zoneCount / totalZones
        local score = warState.scores[fid] or 0

        -- Score victory
        if score >= warConfig.victory_score then
            victoryTracking.leading_faction = fid
            WarManager.SetWarPhase(PHASE.VICTORY)
            return
        end

        -- Territory victory (must hold for N seconds)
        if territoryPct >= warConfig.victory_territory then
            if victoryTracking.leading_faction == fid and victoryTracking.hold_start then
                local holdTime = (now - victoryTracking.hold_start) / 1000
                if holdTime >= warConfig.victory_hold_time then
                    WarManager.SetWarPhase(PHASE.VICTORY)
                    return
                end
            else
                victoryTracking.leading_faction = fid
                victoryTracking.hold_start = now
            end

            -- Transition to decisive if not already
            if warState.phase ~= PHASE.DECISIVE then
                WarManager.SetWarPhase(PHASE.DECISIVE)
            end
        elseif territoryPct >= warConfig.decisive_threshold then
            -- Near victory — decisive phase
            if warState.phase == PHASE.ACTIVE then
                victoryTracking.leading_faction = fid
                WarManager.SetWarPhase(PHASE.DECISIVE)
            end
        else
            -- If this was the leading faction and they fell below, revert to active
            if victoryTracking.leading_faction == fid then
                victoryTracking.leading_faction = nil
                victoryTracking.hold_start = nil
                if warState.phase == PHASE.DECISIVE then
                    WarManager.SetWarPhase(PHASE.ACTIVE)
                end
            end
        end
    end
end

-- ============================================================
-- PHASE AUTO-ADVANCE
-- ============================================================

local function checkPhaseAdvance()
    local now = GetGameTimer()
    local elapsed = (now - warState.phase_started) / 1000

    if warState.phase == PHASE.CEASEFIRE then
        if elapsed >= warConfig.ceasefire_duration then
            WarManager.SetWarPhase(PHASE.BUILDUP)
        end
    elseif warState.phase == PHASE.BUILDUP then
        if elapsed >= warConfig.buildup_duration then
            WarManager.SetWarPhase(PHASE.ACTIVE)
        end
    end
end

-- ============================================================
-- PERSISTENCE
-- ============================================================

function saveWarState()
    if not CoreDatabase then return end

    CoreDatabase.Execute([[
        INSERT INTO aw_war_state (id, phase, round, scores, territory, started_at)
        VALUES (1, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE phase = VALUES(phase), round = VALUES(round),
        scores = VALUES(scores), territory = VALUES(territory), started_at = VALUES(started_at)
    ]], {
        warState.phase,
        warState.round,
        json.encode(warState.scores),
        json.encode(warState.territory),
        warState.started_at,
    })
end

function loadWarState()
    if not CoreDatabase then return end

    local result = CoreDatabase.FetchOne('SELECT * FROM aw_war_state WHERE id = 1')
    if result then
        warState.phase = result.phase or PHASE.CEASEFIRE
        warState.round = result.round or 1
        warState.started_at = result.started_at or GetGameTimer()

        if result.scores then
            local ok, decoded = pcall(json.decode, result.scores)
            if ok and decoded then warState.scores = decoded end
        end
        if result.territory then
            local ok, decoded = pcall(json.decode, result.territory)
            if ok and decoded then warState.territory = decoded end
        end

        warState.phase_started = GetGameTimer()

        CoreLogger.Info('aw-war', ('Loaded war state: Round %d, Phase: %s'):format(warState.round, warState.phase))
    end
end

-- ============================================================
-- QUERY EXPORTS
-- ============================================================

function WarManager.GetWarState()
    return {
        phase           = warState.phase,
        round           = warState.round,
        scores          = warState.scores,
        territory       = warState.territory,
        victory_faction = warState.victory_faction,
        total_zones     = warState.total_zones,
    }
end

function WarManager.GetWarPhase()
    return warState.phase
end

function WarManager.GetWarScore(factionId)
    if factionId then
        return warState.scores[factionId] or 0
    end
    return warState.scores
end

function WarManager.GetTimeInPhase()
    return (GetGameTimer() - warState.phase_started) / 1000
end

-- ============================================================
-- EVENT HANDLERS
-- ============================================================

AddEventHandler(AW.EVENT.FACTION_SCORE_CHANGED, function(data)
    updateScores()
end)

AddEventHandler(AW.EVENT.ZONE_CAPTURED, function(data)
    updateTerritory()
end)

AddEventHandler(AW.EVENT.ZONE_LOST, function(data)
    updateTerritory()
end)

--- Sync war state for newly loaded players
AddEventHandler(AW.EVENT.PLAYER_LOADED, function(data)
    if data and data.source then
        TriggerClientEvent('aw:war:state_sync', data.source, WarManager.GetWarState())
    end
end)

-- ============================================================
-- PERIODIC TASKS
-- ============================================================

-- War tick: every 5s — check phase advance, victory conditions, save
CreateThread(function()
    while true do
        Wait(5000)
        if not initialized then goto continue end

        updateScores()
        updateTerritory()
        checkPhaseAdvance()
        checkVictoryConditions()

        -- Broadcast war state periodically
        TriggerClientEvent('aw:war:state_update', -1, {
            phase     = warState.phase,
            round     = warState.round,
            scores    = warState.scores,
            territory = warState.territory,
        })

        ::continue::
    end
end)

-- Save every 60s
CreateThread(function()
    while true do
        Wait(60000)
        if initialized then
            saveWarState()
        end
    end
end)

-- ============================================================
-- INITIALIZATION
-- ============================================================

AddEventHandler(AW.EVENT.CORE_READY, function()
    if initialized then return end
    initialized = true

    -- Load war config from registry
    if CoreRegistry then
        local cfg = CoreRegistry.Get('config', 'war')
        if cfg then
            for k, v in pairs(cfg) do
                if warConfig[k] ~= nil then
                    warConfig[k] = v
                end
            end
        end
    end

    -- Create DB table
    if CoreDatabase then
        CoreDatabase.Execute([[
            CREATE TABLE IF NOT EXISTS aw_war_state (
                id INT PRIMARY KEY DEFAULT 1,
                phase VARCHAR(32) DEFAULT 'ceasefire',
                round INT DEFAULT 1,
                scores JSON,
                territory JSON,
                started_at BIGINT
            )
        ]])
    end

    -- Load previous state
    loadWarState()
    warState.started_at = warState.started_at or GetGameTimer()
    warState.phase_started = GetGameTimer()

    -- Initial territory count
    updateTerritory()
    updateScores()

    if CoreAPI and CoreAPI.RegisterModule then
        CoreAPI.RegisterModule({
            name     = 'aw-war',
            version  = '1.0.0',
            priority = 600,
        })
    end

    CoreLogger.Info('aw-war', ('War module initialized — Round %d, Phase: %s'):format(warState.round, warState.phase))
end)

-- ============================================================
-- EXPORTS REGISTRATION
-- ============================================================

exports('GetWarState',        function(...) return WarManager.GetWarState(...) end)
exports('GetWarPhase',        function(...) return WarManager.GetWarPhase(...) end)
exports('GetWarScore',        function(...) return WarManager.GetWarScore(...) end)
exports('SetWarPhase',        function(...) return WarManager.SetWarPhase(...) end)
exports('ResetWar',           function(...) return WarManager.ResetWar(...) end)
exports('GetTimeInPhase',     function(...) return WarManager.GetTimeInPhase(...) end)
exports('GetVictoryProgress', function(...) return WarManager.GetVictoryProgress(...) end)
