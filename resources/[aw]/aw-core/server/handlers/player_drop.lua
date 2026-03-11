--[[
    Handler: playerDropped
    Stage 8: Disconnect Handling
]]

AddEventHandler('playerDropped', function(reason)
    local src = source
    local player = CoreIdentity.GetByServerId(src)

    if not player then return end

    CoreLogger.Info('disconnect', 'Player disconnecting: %s [%s] — %s', player.name, player.awid, reason)

    -- Emit disconnecting event (modules: clean up aircraft, remove from faction count, etc.)
    CoreEvents.Emit(AW.EVENT.PLAYER_DROPPED, {
        awid     = player.awid,
        name     = player.name,
        serverId = src,
        reason   = reason,
        faction  = player.factionId,
        state    = player.state,
    })

    -- Flush and remove player
    CoreIdentity.RemovePlayer(player.awid)

    -- Clear StateBags
    local ped = GetPlayerPed(src)
    if ped and ped ~= 0 then
        local entity = Entity(ped)
        if entity and entity.state then
            entity.state:set('aw_awid', nil, true)
            entity.state:set('aw_faction', nil, true)
            entity.state:set('aw_callsign', nil, true)
            entity.state:set('aw_role', nil, true)
        end
    end

    -- Clear volatile state
    CoreState.Cleanup(player.awid)

    CoreLogger.Info('disconnect', 'Player cleanup complete: %s', player.awid)
end)
