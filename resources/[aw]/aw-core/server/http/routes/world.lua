--[[
    HTTP Routes: World
    GET /api/v1/world/zones
    GET /api/v1/world/bases
]]

CoreHttpRouter.Route('GET', '/api/v1/world/zones', function()
    local zones = CoreRegistry.GetAll('zone')
    local list = {}
    for id, data in pairs(zones) do
        list[#list + 1] = {
            id      = id,
            name    = data.name,
            owner   = data.owner,
            center  = data.center,
            radius  = data.radius,
        }
    end
    return { data = { zones = list } }
end, 'read')

CoreHttpRouter.Route('GET', '/api/v1/world/bases', function()
    local bases = CoreRegistry.GetAll('base')
    local list = {}
    for id, data in pairs(bases) do
        list[#list + 1] = {
            id       = id,
            name     = data.name,
            faction  = data.faction,
            position = data.position,
            health   = data.health,
        }
    end
    return { data = { bases = list } }
end, 'read')
