--[[
    HTTP Routes: Server
    GET /api/v1/server/status
    GET /api/v1/server/config
]]

CoreHttpRouter.Route('GET', '/api/v1/server/status', function()
    local health = CoreLifecycle.GetHealth()
    return {
        data = {
            version    = AW.VERSION.STRING,
            uptime     = health.uptime,
            players    = health.players,
            maxPlayers = AW.MAX_PLAYERS,
            booted     = health.booted,
            systems    = health.systems,
            modules    = health.modules,
        }
    }
end, 'read')

CoreHttpRouter.Route('GET', '/api/v1/server/config', function()
    return {
        data = {
            maxPlayers       = AW.MAX_PLAYERS,
            maxAircraft      = AW.MAX_AIRCRAFT,
            respawnDefault   = AW.RESPAWN_DEFAULT,
            version          = AW.VERSION.STRING,
            roles            = CorePermissions.GetAllRoles(),
            registryDomains  = CoreRegistry.GetDomains(),
        }
    }
end, 'read')
