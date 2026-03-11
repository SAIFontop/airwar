--[[
    HTTP Routes: Players
    GET /api/v1/players
    GET /api/v1/players/:awid
    GET /api/v1/players/:awid/stats
]]

CoreHttpRouter.Route('GET', '/api/v1/players', function()
    local players = CoreIdentity.GetAll()
    local list = {}
    for awid, p in pairs(players) do
        list[#list + 1] = {
            awid     = awid,
            name     = p.name,
            callsign = p.callsign,
            faction  = p.factionId,
            role     = p.role,
            state    = p.state,
        }
    end
    return { data = { players = list, count = #list } }
end, 'read')

CoreHttpRouter.Route('GET', '/api/v1/players/:awid', function(req, params)
    local player = CoreIdentity.Get(params.awid)
    if not player then
        return { status = 'error', error = { code = 'PLAYER_NOT_FOUND', message = 'No player with AWID ' .. params.awid } }
    end
    return {
        data = {
            awid       = player.awid,
            name       = player.name,
            callsign   = player.callsign,
            role       = player.role,
            state      = player.state,
            factionId  = player.factionId,
            stats      = player.stats,
            ranking    = player.ranking,
            connectedAt = player.connectedAt,
        }
    }
end, 'read')

CoreHttpRouter.Route('GET', '/api/v1/players/:awid/stats', function(req, params)
    local player = CoreIdentity.Get(params.awid)
    if not player then
        return { status = 'error', error = { code = 'PLAYER_NOT_FOUND', message = 'No player with AWID ' .. params.awid } }
    end
    return { data = player.stats or {} }
end, 'read')
