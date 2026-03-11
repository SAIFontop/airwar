-- ═══════════════════════════════════════════════════════════
-- System 12: Player Manager
-- Connect / disconnect / session data / identifiers
-- ═══════════════════════════════════════════════════════════

Core.Player = {}

local _players = {} -- { [source] = playerData }

-- ───────────────────────────────────────────────────────────
-- Identifier extraction
-- ───────────────────────────────────────────────────────────
local function extractIdentifiers(src)
    local ids = {}
    for i = 0, GetNumPlayerIdentifiers(src) - 1 do
        local id = GetPlayerIdentifier(src, i)
        if id then
            local prefix = id:match('^([^:]+):')
            if prefix then ids[prefix] = id end
        end
    end
    return ids
end

-- ───────────────────────────────────────────────────────────
-- Public API
-- ───────────────────────────────────────────────────────────

function Core.Player.Get(source)
    return _players[source]
end

function Core.Player.GetAll()
    return _players
end

function Core.Player.Exists(source)
    return _players[source] ~= nil
end

function Core.Player.GetIdentifier(source, idType)
    local p = _players[source]
    if not p then return nil end
    return p.identifiers[idType or AW.IDENTIFIER.LICENSE]
end

function Core.Player.GetByIdentifier(identifier)
    for src, p in pairs(_players) do
        for _, id in pairs(p.identifiers) do
            if id == identifier then return src, p end
        end
    end
    return nil
end

function Core.Player.Count()
    return Utils.TableCount(_players)
end

function Core.Player.GetData(source, key)
    local p = _players[source]
    if not p then return nil end
    if not key then return p.data end
    return p.data[key]
end

function Core.Player.SetData(source, key, value)
    local p = _players[source]
    if not p then return end
    p.data[key] = value
end

-- ───────────────────────────────────────────────────────────
-- Connect / Disconnect handlers
-- ───────────────────────────────────────────────────────────

function Core.Player._handleConnect(src)
    local ids     = extractIdentifiers(src)
    local license = ids[AW.IDENTIFIER.LICENSE] or ('unknown:' .. src)
    local name    = GetPlayerName(src) or 'Unknown'

    local playerData = {
        source      = src,
        name        = name,
        identifiers = ids,
        license     = license,
        rank        = AW.RANK.USER,
        joinedAt    = os.time(),
        data        = {},
    }

    -- DB lookup
    if Core.DB.Ready() then
        local rows = Core.DB.Query(
            'SELECT rank, data, play_time FROM ' .. AW.TABLE.PLAYERS .. ' WHERE identifier = ?',
            { license }
        )
        if rows and #rows > 0 then
            playerData.rank     = rows[1].rank or AW.RANK.USER
            playerData.playTime = rows[1].play_time or 0
            if rows[1].data then
                local ok, parsed = pcall(json.decode, rows[1].data)
                if ok and parsed then playerData.data = parsed end
            end
            Core.DB.Execute(
                'UPDATE ' .. AW.TABLE.PLAYERS .. ' SET name = ?, last_seen = NOW() WHERE identifier = ?',
                { name, license }
            )
        else
            Core.DB.Execute(
                'INSERT INTO ' .. AW.TABLE.PLAYERS .. ' (identifier, name, rank) VALUES (?, ?, ?)',
                { license, name, AW.RANK.USER }
            )
        end
    end

    _players[src] = playerData
    Core.State.SetPlayer(src, 'aw:rank', playerData.rank)
    Core.Events.Emit(AW.EVENT.PLAYER_LOADED, src, playerData)
    Core.Log.Info('player', '%s connected (source: %d)', name, src)
    return playerData
end

function Core.Player._handleDisconnect(src, reason)
    local p = _players[src]
    if not p then return end

    -- Save to DB
    if Core.DB.Ready() then
        local sessionTime = os.time() - p.joinedAt
        Core.DB.Execute(
            'UPDATE ' .. AW.TABLE.PLAYERS .. ' SET play_time = play_time + ?, last_seen = NOW(), data = ? WHERE identifier = ?',
            { sessionTime, json.encode(p.data), p.license }
        )
    end

    Core.Events.Emit(AW.EVENT.PLAYER_DROPPED, src, p, reason)
    Core.Security.CleanupSource(src)
    _players[src] = nil
    Core.Log.Info('player', '%s disconnected: %s', p.name, reason or 'unknown')
end

-- ───────────────────────────────────────────────────────────
-- Init
-- ───────────────────────────────────────────────────────────

function Core.Player._init()
    AddEventHandler('playerConnecting', function(name, _, deferrals)
        local src = source
        deferrals.defer()
        Wait(0)
        deferrals.update('Loading...')
        Core.Error.Try(function()
            Core.Player._handleConnect(src)
        end)
        deferrals.done()
    end)

    AddEventHandler('playerDropped', function(reason)
        local src = source
        Core.Error.Try(function()
            Core.Player._handleDisconnect(src, reason)
        end)
    end)

    Core.Log.Info('core', 'Player manager initialized')
end
