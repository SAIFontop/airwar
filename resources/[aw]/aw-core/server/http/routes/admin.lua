--[[
    HTTP Routes: Admin
    POST /api/v1/admin/kick
    POST /api/v1/admin/ban
    POST /api/v1/admin/unban
    POST /api/v1/admin/announce
]]

CoreHttpRouter.Route('POST', '/api/v1/admin/kick', function(req)
    local body = req.body
    if not body or not body.awid then
        return { status = 'error', error = { code = 'BAD_REQUEST', message = 'Missing awid' } }
    end

    local player = CoreIdentity.Get(body.awid)
    if not player then
        return { status = 'error', error = { code = 'PLAYER_NOT_FOUND', message = 'Player not online' } }
    end

    DropPlayer(tostring(player.serverId), body.reason or 'Kicked by admin')
    CoreLogger.Info('admin:http', 'Kicked %s via API: %s', body.awid, body.reason or 'no reason')
    return { data = { kicked = body.awid } }
end, 'admin')

CoreHttpRouter.Route('POST', '/api/v1/admin/ban', function(req)
    local body = req.body
    if not body or not body.awid then
        return { status = 'error', error = { code = 'BAD_REQUEST', message = 'Missing awid' } }
    end

    local player = CoreIdentity.Get(body.awid)
    local identifiers = player and player.license or body.identifier or ''

    CoreDatabase.Execute(
        'INSERT INTO ' .. AW.TABLE.BANS .. ' (awid, identifier, reason, banned_by, expires_at, is_active) VALUES (?, ?, ?, ?, ?, 1)',
        { body.awid, identifiers, body.reason or 'No reason', 'API', body.expires_at }
    )

    -- Kick if online
    if player then
        DropPlayer(tostring(player.serverId), 'Banned: ' .. (body.reason or 'No reason'))
    end

    CoreLogger.Info('admin:http', 'Banned %s via API: %s', body.awid, body.reason or 'no reason')
    return { data = { banned = body.awid } }
end, 'admin')

CoreHttpRouter.Route('POST', '/api/v1/admin/unban', function(req)
    local body = req.body
    if not body or not body.awid then
        return { status = 'error', error = { code = 'BAD_REQUEST', message = 'Missing awid' } }
    end

    CoreDatabase.Execute(
        'UPDATE ' .. AW.TABLE.BANS .. ' SET is_active = 0 WHERE awid = ? AND is_active = 1',
        { body.awid }
    )

    CoreLogger.Info('admin:http', 'Unbanned %s via API', body.awid)
    return { data = { unbanned = body.awid } }
end, 'admin')

CoreHttpRouter.Route('POST', '/api/v1/admin/announce', function(req)
    local body = req.body
    if not body or not body.message then
        return { status = 'error', error = { code = 'BAD_REQUEST', message = 'Missing message' } }
    end

    TriggerClientEvent('chat:addMessage', -1, {
        args = { AW.CHAT_PREFIX .. body.message }
    })

    CoreLogger.Info('admin:http', 'Server announcement via API: %s', body.message)
    return { data = { announced = true } }
end, 'admin')
