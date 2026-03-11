--[[
    HTTP Routes: Missions
    GET /api/v1/missions
    GET /api/v1/missions/history
]]

CoreHttpRouter.Route('GET', '/api/v1/missions', function()
    -- Active missions via module API (if registered)
    if CoreAPI.IsModuleAvailable('mission') then
        local missions = CoreAPI.Call('mission', 'GetActiveMissions')
        return { data = { missions = missions or {} } }
    end
    return { data = { missions = {} } }
end, 'read')

CoreHttpRouter.Route('GET', '/api/v1/missions/history', function()
    -- Historical missions from database
    local history = CoreDatabase.Query('SELECT * FROM ' .. AW.TABLE.MISSIONS_HISTORY .. ' ORDER BY completed_at DESC LIMIT 50')
    return { data = { missions = history or {} } }
end, 'read')
