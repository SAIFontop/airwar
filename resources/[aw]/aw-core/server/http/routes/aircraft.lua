--[[
    HTTP Routes: Aircraft
    GET /api/v1/aircraft — All registered aircraft types
    GET /api/v1/aircraft/:typeId — Specific aircraft type data
]]

CoreHttpRouter.Route('GET', '/api/v1/aircraft', function()
    local types = CoreRegistry.GetAll('aircraft')
    local list = {}
    for id, data in pairs(types) do
        list[#list + 1] = {
            id     = id,
            name   = data.name,
            role   = data.role,
            mass   = data.mass,
            speed  = data.maxSpeed,
            tier   = data.tier,
        }
    end
    return { data = { aircraft = list, count = #list } }
end, 'read')

CoreHttpRouter.Route('GET', '/api/v1/aircraft/:typeId', function(req, params)
    local aircraft = CoreRegistry.Get('aircraft', params.typeId)
    if not aircraft then
        return { status = 'error', error = { code = 'AIRCRAFT_NOT_FOUND', message = 'No aircraft type: ' .. params.typeId } }
    end
    return { data = aircraft }
end, 'read')
