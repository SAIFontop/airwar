--[[
    HTTP Routes: Factions
    GET /api/v1/factions
    GET /api/v1/factions/:id
    GET /api/v1/factions/:id/players
]]

CoreHttpRouter.Route('GET', '/api/v1/factions', function()
    local factions = CoreRegistry.GetAll('faction')
    local result = {}
    for id, data in pairs(factions) do
        result[#result + 1] = {
            id    = id,
            name  = data.name,
            color = data.color,
            icon  = data.icon,
        }
    end
    return { data = { factions = result } }
end, 'read')

CoreHttpRouter.Route('GET', '/api/v1/factions/:id', function(req, params)
    local faction = CoreRegistry.Get('faction', params.id)
    if not faction then
        return { status = 'error', error = { code = 'FACTION_NOT_FOUND', message = 'No faction: ' .. params.id } }
    end
    return { data = faction }
end, 'read')

CoreHttpRouter.Route('GET', '/api/v1/factions/:id/players', function(req, params)
    local players = CoreIdentity.GetAll()
    local list = {}
    for awid, p in pairs(players) do
        if p.factionId == params.id then
            list[#list + 1] = {
                awid     = awid,
                name     = p.name,
                callsign = p.callsign,
                role     = p.role,
            }
        end
    end
    return { data = { players = list, count = #list } }
end, 'read')
