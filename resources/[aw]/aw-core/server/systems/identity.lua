--[[
    System 1: Identity
    AWID generation, player object management, session tracking
    The only system that creates/destroys player entities
]]

local Identity = {}
Identity.__index = Identity

local players = {}        -- { [awid] = PlayerObject }
local serverIdMap = {}    -- { [serverId] = awid }
local licenseMap = {}     -- { [license] = awid }

-- ============================================================
-- PLAYER OBJECT
-- ============================================================

---@class PlayerObject
---@field awid string Permanent player ID
---@field sessionId string Current session ID
---@field serverId number FiveM server ID
---@field license string Primary identifier
---@field steam string|nil
---@field discord string|nil
---@field name string Player name
---@field callsign string|nil
---@field factionId string|nil
---@field role string Permission role
---@field state string Player state (AW.PLAYER_STATE)
---@field stats table Combat/flight stats (cached)
---@field ranking table Rank data (cached)
---@field permissions table Permission nodes
---@field dirty table Dirty flags for write-behind
---@field connectedAt number Timestamp
---@field metadata table Flexible data store

--- Create a new player object
---@param awid string
---@param serverId number
---@param identifiers table
---@param dbRow table|nil Existing DB data
---@return PlayerObject
local function createPlayerObject(awid, serverId, identifiers, dbRow)
    dbRow = dbRow or {}
    return {
        awid = awid,
        sessionId = Utils.GenerateId(AW.PREFIX.SESSION, 8),
        serverId = serverId,
        license = identifiers.license,
        steam = identifiers.steam,
        discord = identifiers.discord,
        name = GetPlayerName(serverId) or dbRow.name or 'Unknown',
        callsign = dbRow.callsign,
        factionId = dbRow.faction_id,
        role = dbRow.role or 'player',
        state = AW.PLAYER_STATE.CONNECTING,
        stats = {
            kills = 0, deaths = 0, assists = 0, sorties = 0,
            flight_time_seconds = 0, missiles_fired = 0, missiles_hit = 0,
            gun_rounds_fired = 0, gun_rounds_hit = 0,
            damage_dealt = 0, damage_taken = 0,
            missions_completed = 0, missions_failed = 0,
            money_earned = 0, money_spent = 0,
        },
        ranking = {
            rank_name = 'Recruit', rank_tier = 0, xp = 0, season_xp = 0,
        },
        permissions = {},
        dirty = {},
        connectedAt = os.time(),
        metadata = {},
    }
end

-- ============================================================
-- CORE API
-- ============================================================

function Identity.Init()
    CoreLogger.Info('identity', 'Identity system initialized')
end

--- Extract identifiers from a connecting player
---@param serverId number
---@return table identifiers { license, steam, discord, ip_hash }
function Identity.ExtractIdentifiers(serverId)
    local ids = { license = nil, steam = nil, discord = nil, ip_hash = nil }

    for i = 0, GetNumPlayerIdentifiers(serverId) - 1 do
        local id = GetPlayerIdentifier(serverId, i)
        if id then
            if id:find('^license:') then
                ids.license = id
            elseif id:find('^steam:') then
                ids.steam = id
            elseif id:find('^discord:') then
                ids.discord = id
            elseif id:find('^ip:') then
                ids.ip_hash = Utils.SimpleHash(id)
            end
        end
    end

    return ids
end

--- Register a player (called during connection)
---@param serverId number
---@param identifiers table
---@return PlayerObject|nil
---@return string|nil error
function Identity.RegisterPlayer(serverId, identifiers)
    if not identifiers.license then
        return nil, 'No license identifier found'
    end

    -- Check if already connected
    if licenseMap[identifiers.license] then
        local existingAwid = licenseMap[identifiers.license]
        CoreLogger.Warn('identity', 'Duplicate connection for license %s (existing AWID: %s)', identifiers.license, existingAwid)
        return nil, 'Already connected'
    end

    -- Lookup or create in DB
    local dbRow = CoreDatabase.Table(AW.TABLE.PLAYERS):find({ license = identifiers.license })
    local awid

    if dbRow then
        awid = dbRow.awid
        CoreLogger.Info('identity', 'Returning player: %s (AWID: %s)', GetPlayerName(serverId), awid)

        -- Update last_seen
        CoreDatabase.Table(AW.TABLE.PLAYERS):update({ awid = awid }, {
            last_seen = os.date('%Y-%m-%d %H:%M:%S'),
            name = GetPlayerName(serverId) or dbRow.name,
        })
    else
        -- New player — generate AWID
        awid = Utils.GenerateId(AW.PREFIX.PLAYER, 6)

        -- Ensure uniqueness
        while CoreDatabase.Table(AW.TABLE.PLAYERS):find({ awid = awid }) do
            awid = Utils.GenerateId(AW.PREFIX.PLAYER, 6)
        end

        CoreDatabase.Table(AW.TABLE.PLAYERS):insert({
            awid = awid,
            license = identifiers.license,
            steam = identifiers.steam,
            discord = identifiers.discord,
            name = GetPlayerName(serverId) or 'Unknown',
        })

        -- Create initial stats row
        CoreDatabase.Table(AW.TABLE.STATS):insert({ awid = awid })

        -- Create initial rankings row
        CoreDatabase.Table(AW.TABLE.RANKINGS):insert({ awid = awid })

        CoreLogger.Info('identity', 'New player created: %s (AWID: %s)', GetPlayerName(serverId), awid)
    end

    -- Load stats from DB
    local statsRow = CoreDatabase.Table(AW.TABLE.STATS):find({ awid = awid })
    local rankRow = CoreDatabase.Table(AW.TABLE.RANKINGS):find({ awid = awid })

    -- Create player object
    local player = createPlayerObject(awid, serverId, identifiers, dbRow)

    if statsRow then
        for k, v in pairs(statsRow) do
            if player.stats[k] ~= nil then player.stats[k] = v end
        end
    end

    if rankRow then
        player.ranking = {
            rank_name = rankRow.rank_name or 'Recruit',
            rank_tier = rankRow.rank_tier or 0,
            xp = rankRow.xp or 0,
            season_xp = rankRow.season_xp or 0,
        }
    end

    -- Create session record
    CoreDatabase.Table(AW.TABLE.SESSIONS):insert({
        session_id = player.sessionId,
        awid = awid,
        ip_hash = identifiers.ip_hash or 'unknown',
    })

    -- Store in lookups
    players[awid] = player
    serverIdMap[serverId] = awid
    licenseMap[identifiers.license] = awid

    return player, nil
end

--- Remove a player (on disconnect)
---@param serverId number
function Identity.RemovePlayer(serverId)
    local awid = serverIdMap[serverId]
    if not awid then return end

    local player = players[awid]
    if not player then return end

    -- Flush any pending writes
    CoreDatabase.FlushPlayer(awid)

    -- Save final stats
    CoreDatabase.Table(AW.TABLE.STATS):update({ awid = awid }, player.stats)
    CoreDatabase.Table(AW.TABLE.RANKINGS):update({ awid = awid }, player.ranking)

    -- Close session record
    local duration = os.time() - player.connectedAt
    CoreDatabase.Table(AW.TABLE.SESSIONS):update(
        { session_id = player.sessionId },
        { disconnected_at = os.date('%Y-%m-%d %H:%M:%S'), duration_seconds = duration }
    )

    -- Clean up lookups
    licenseMap[player.license] = nil
    serverIdMap[serverId] = nil
    players[awid] = nil

    CoreLogger.Info('identity', 'Player removed: %s (AWID: %s, session: %ds)', player.name, awid, duration)
end

-- ============================================================
-- PLAYER ACCESS API
-- ============================================================

---@param awid string
---@return PlayerObject|nil
function Identity.GetPlayer(awid)
    return players[awid]
end

---@param serverId number
---@return PlayerObject|nil
function Identity.GetPlayerByServerId(serverId)
    local awid = serverIdMap[serverId]
    return awid and players[awid] or nil
end

---@return table { [awid] = PlayerObject }
function Identity.GetAllPlayers()
    return players
end

---@return number
function Identity.GetPlayerCount()
    local count = 0
    for _ in pairs(players) do count = count + 1 end
    return count
end

--- Set player state
---@param awid string
---@param state string From AW.PLAYER_STATE
function Identity.SetPlayerState(awid, state)
    local player = players[awid]
    if player then
        player.state = state
    end
end

--- Mark a stat as dirty (for write-behind)
---@param awid string
---@param section string 'stats' or 'ranking'
function Identity.MarkDirty(awid, section)
    local player = players[awid]
    if player then
        player.dirty[section] = true
    end
end

--- Check ban status
---@param license string
---@return boolean banned
---@return string|nil reason
---@return string|nil expires
function Identity.CheckBan(license)
    local ban = CoreDatabase.Table(AW.TABLE.BANS):find({
        awid = (CoreDatabase.Table(AW.TABLE.PLAYERS):find({ license = license }) or {}).awid or '',
        active = 1,
    })

    if ban then
        -- Check if expired
        if ban.expires_at and os.time() > ban.expires_at then
            CoreDatabase.Table(AW.TABLE.BANS):update({ id = ban.id }, { active = 0 })
            return false, nil, nil
        end
        return true, ban.reason, ban.expires_at
    end

    return false, nil, nil
end

CoreIdentity = Identity
