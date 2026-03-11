--[[
    Handler: playerConnecting
    Stage 1-4 of the Player Lifecycle
]]

AddEventHandler('playerConnecting', function(name, _, deferrals)
    local src = source
    deferrals.defer()
    Wait(0) -- Required for async deferrals

    -- Must be booted
    if not CoreLifecycle.IsReady() then
        deferrals.done('Server is still loading. Please try again in a moment.')
        return
    end

    deferrals.update('Validating connection...')

    -- Extract identifiers
    local identifiers = CoreIdentity.ExtractIdentifiers(src)
    if not identifiers.license then
        deferrals.done('A valid FiveM license is required to connect.')
        CoreLogger.Warn('connect', 'Rejected %s — no license identifier', name)
        return
    end

    -- Emit connecting event (interceptable)
    local eventData = { name = name, serverId = src, identifiers = identifiers }
    CoreEvents.Emit(AW.EVENT.PLAYER_CONNECTING, eventData)

    -- Ban check
    deferrals.update('Checking account...')
    local banned, banReason, banExpiry = CoreIdentity.CheckBan(identifiers)
    if banned then
        local msg = 'You are banned from this server.'
        if banReason then msg = msg .. '\nReason: ' .. banReason end
        if banExpiry then msg = msg .. '\nExpires: ' .. os.date('%Y-%m-%d %H:%M', banExpiry) end
        deferrals.done(msg)
        CoreLogger.Info('connect', 'Banned player rejected: %s (%s)', name, banReason or 'no reason')
        return
    end

    -- Register player (Stages 2-3: Identity Resolution + Account Loading)
    deferrals.update('Loading pilot profile...')
    local player, err = CoreIdentity.RegisterPlayer(src, name, identifiers)
    if not player then
        deferrals.done('Failed to load your profile. Please try again.\n' .. (err or ''))
        CoreLogger.Error('connect', 'Failed to register player %s: %s', name, err or 'unknown')
        return
    end

    -- Resolve role from admin config
    local role = CorePermissions.ResolvePlayerRole(identifiers)
    player.role = role
    player.permissions = CorePermissions.BuildPlayerPermissions(role)

    -- Stage 4: Pilot Profile Initialization
    deferrals.update('Initializing pilot...')

    -- Set StateBags on player
    local ped = GetPlayerPed(src)
    if ped and ped ~= 0 then
        local entity = Entity(ped)
        if entity and entity.state then
            entity.state:set('aw_awid', player.awid, true)
            entity.state:set('aw_faction', player.factionId or '', true)
            entity.state:set('aw_callsign', player.callsign or player.name, true)
            entity.state:set('aw_role', player.role, true)
        end
    end

    -- Set player state to loading
    CoreIdentity.SetPlayerState(player.awid, AW.PLAYER_STATE.LOADING)

    deferrals.done()

    -- Post-connection events (after player is in)
    CoreLogger.Info('connect', 'Player connected: %s [%s] (role: %s)', player.name, player.awid, player.role)
    CoreEvents.Emit(AW.EVENT.PLAYER_JOINED, { awid = player.awid, name = player.name, role = player.role, isNew = player._isNew })
end)
