-- ═══════════════════════════════════════════════════════════
-- System 13: Permission System
-- Rank-based + node-based permissions with DB persistence
-- ═══════════════════════════════════════════════════════════

Core.Permission = {}

local _cache = {} -- { [identifier] = { [node] = true } }

function Core.Permission.Has(source, node)
    local p = Core.Player.Get(source)
    if not p then return false end

    -- Owner rank has all permissions
    if p.rank == AW.RANK.OWNER then return true end

    -- Rank-level check (e.g. passing "admin" checks if rank >= admin)
    local rankLevel = AW.RANK_LEVEL[p.rank] or 0
    local nodeLevel = AW.RANK_LEVEL[node]
    if nodeLevel and rankLevel >= nodeLevel then return true end

    -- Specific permission node check
    local perms = _cache[p.license]
    if perms and perms[node] then return true end

    -- Wildcard (e.g. "admin.*" grants "admin.kick")
    local prefix = node:match('^(.+)%.')
    if prefix and perms and perms[prefix .. '.*'] then return true end

    return false
end

function Core.Permission.Add(source, node)
    local p = Core.Player.Get(source)
    if not p then return false end

    if not _cache[p.license] then _cache[p.license] = {} end
    _cache[p.license][node] = true

    if Core.DB.Ready() then
        Core.DB.Execute(
            'INSERT IGNORE INTO ' .. AW.TABLE.PERMISSIONS .. ' (identifier, permission) VALUES (?, ?)',
            { p.license, node }
        )
    end
    return true
end

function Core.Permission.Remove(source, node)
    local p = Core.Player.Get(source)
    if not p then return false end

    if _cache[p.license] then
        _cache[p.license][node] = nil
    end

    if Core.DB.Ready() then
        Core.DB.Execute(
            'DELETE FROM ' .. AW.TABLE.PERMISSIONS .. ' WHERE identifier = ? AND permission = ?',
            { p.license, node }
        )
    end
    return true
end

function Core.Permission.SetRank(source, rank)
    local p = Core.Player.Get(source)
    if not p then return false end

    p.rank = rank
    Core.State.SetPlayer(source, 'aw:rank', rank)

    if Core.DB.Ready() then
        Core.DB.Execute(
            'UPDATE ' .. AW.TABLE.PLAYERS .. ' SET rank = ? WHERE identifier = ?',
            { rank, p.license }
        )
    end
    return true
end

function Core.Permission.GetRank(source)
    local p = Core.Player.Get(source)
    return p and p.rank or AW.RANK.USER
end

function Core.Permission._loadPlayer(source)
    local p = Core.Player.Get(source)
    if not p or not Core.DB.Ready() then return end

    local rows = Core.DB.Query(
        'SELECT permission FROM ' .. AW.TABLE.PERMISSIONS .. ' WHERE identifier = ?',
        { p.license }
    )

    _cache[p.license] = {}
    if rows then
        for _, row in ipairs(rows) do
            _cache[p.license][row.permission] = true
        end
    end
end

function Core.Permission._init()
    Core.Events.On(AW.EVENT.PLAYER_LOADED, function(source)
        Core.Permission._loadPlayer(source)
    end)

    Core.Events.On(AW.EVENT.PLAYER_DROPPED, function(source, playerData)
        if playerData then
            _cache[playerData.license] = nil
        end
    end)

    Core.Log.Info('core', 'Permission system initialized')
end
