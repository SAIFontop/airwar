--[[
    aw-admin/server.lua
    Administration commands, permission checks, server management
    Tier 7 — depends on aw-core, aw-config, aw-faction, aw-aircraft, aw-world, aw-war
]]

-- ─── Wait for Core ───────────────────────────────────────────────────
while not exports['aw-core']:IsReady() do Wait(100) end

local CoreAPI        = exports['aw-core']:GetCoreAPI()
local CoreCommands   = CoreAPI.GetSystem('Commands')
local CorePermissions= CoreAPI.GetSystem('Permissions')
local CoreEvents     = CoreAPI.GetSystem('Events')
local CoreState      = CoreAPI.GetSystem('State')
local CoreLogger     = CoreAPI.GetSystem('Logger')

-- ─── Module State ────────────────────────────────────────────────────
local MODULE_STATE = {
    name = 'aw-admin',
    admins = {},          -- awid → { level = int, source = int }
    spectating = {},      -- awid → target_awid or nil
    godmode = {},         -- awid → true
}

local AW = _G.AW or {}

-- ─── Admin Levels ────────────────────────────────────────────────────
local ADMIN_LEVELS = {
    moderator = 1,   -- kick, mute, spectate
    admin     = 2,   -- ban, teleport, spawn, weather, force faction
    superadmin= 3,   -- restart modules, force war end, god mode, debug
}

-- ─── Helpers ─────────────────────────────────────────────────────────
local function getAWID(source)
    local ok, awid = pcall(function() return exports['aw-core']:GetAWID(source) end)
    return ok and awid or nil
end

local function isAdmin(source)
    local awid = getAWID(source)
    return awid and MODULE_STATE.admins[awid] ~= nil
end

local function getAdminLevel(source)
    local awid = getAWID(source)
    if not awid then return 0 end
    local entry = MODULE_STATE.admins[awid]
    return entry and entry.level or 0
end

local function requireLevel(source, level)
    if getAdminLevel(source) < level then
        TriggerClientEvent('chat:addMessage', source, {
            args = { '^1[ADMIN]', 'Insufficient permissions.' }
        })
        return false
    end
    return true
end

local function broadcast(msg)
    TriggerClientEvent('chat:addMessage', -1, {
        args = { '^3[ADMIN]', msg }
    })
end

local function notify(source, msg)
    TriggerClientEvent('chat:addMessage', source, {
        args = { '^3[ADMIN]', msg }
    })
end

local function getPlayerSource(targetId)
    -- Try by server id
    local id = tonumber(targetId)
    if id and GetPlayerName(id) then return id end
    -- Try by awid
    for _, playerId in ipairs(GetPlayers()) do
        local awid = getAWID(tonumber(playerId))
        if awid == targetId then return tonumber(playerId) end
    end
    return nil
end

-- ─── Load admin list from permissions ────────────────────────────────
local function loadAdmins()
    -- Admins defined via aw-core permissions: anyone with 'admin.*' node
    for _, playerId in ipairs(GetPlayers()) do
        local src = tonumber(playerId)
        local awid = getAWID(src)
        if awid then
            local hasSuperAdmin = CorePermissions.HasPermission(awid, 'admin.superadmin')
            local hasAdmin = CorePermissions.HasPermission(awid, 'admin.admin')
            local hasMod = CorePermissions.HasPermission(awid, 'admin.moderator')

            if hasSuperAdmin then
                MODULE_STATE.admins[awid] = { level = 3, source = src }
            elseif hasAdmin then
                MODULE_STATE.admins[awid] = { level = 2, source = src }
            elseif hasMod then
                MODULE_STATE.admins[awid] = { level = 1, source = src }
            end
        end
    end
end

-- ─── Kick Command ────────────────────────────────────────────────────
CoreCommands.Register('awadmin:kick', {
    description = 'Kick a player',
    argsDescription = { 'target (id/awid)', 'reason' },
    restricted = true,
}, function(source, args)
    if not requireLevel(source, 1) then return end
    local targetSrc = getPlayerSource(args[1])
    if not targetSrc then return notify(source, 'Player not found.') end
    local reason = table.concat(args, ' ', 2) or 'No reason specified'
    DropPlayer(targetSrc, '[AIRWAR] Kicked: ' .. reason)
    broadcast('Player kicked: ' .. GetPlayerName(targetSrc) .. ' — ' .. reason)
    CoreLogger.Log('admin', 'info', 'Kick: ' .. GetPlayerName(targetSrc), { admin = getAWID(source), reason = reason })
end)

-- ─── Ban Command ─────────────────────────────────────────────────────
CoreCommands.Register('awadmin:ban', {
    description = 'Ban a player',
    argsDescription = { 'target (id/awid)', 'duration (days)', 'reason' },
    restricted = true,
}, function(source, args)
    if not requireLevel(source, 2) then return end
    local targetSrc = getPlayerSource(args[1])
    if not targetSrc then return notify(source, 'Player not found.') end
    local duration = tonumber(args[2]) or 1
    local reason = table.concat(args, ' ', 3) or 'No reason specified'
    local targetAwid = getAWID(targetSrc)

    -- Store ban in database
    local CoreDatabase = CoreAPI.GetSystem('Database')
    CoreDatabase.Execute([[
        INSERT INTO aw_bans (awid, banned_by, reason, duration_days, banned_at)
        VALUES (?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE reason = VALUES(reason), duration_days = VALUES(duration_days), banned_at = NOW()
    ]], { targetAwid, getAWID(source), reason, duration })

    DropPlayer(targetSrc, '[AIRWAR] Banned for ' .. duration .. ' day(s): ' .. reason)
    broadcast('Player banned: ' .. GetPlayerName(targetSrc) .. ' — ' .. duration .. 'd — ' .. reason)
    CoreLogger.Log('admin', 'warn', 'Ban: ' .. (targetAwid or 'unknown'), { admin = getAWID(source), duration = duration, reason = reason })
end)

-- ─── Unban Command ───────────────────────────────────────────────────
CoreCommands.Register('awadmin:unban', {
    description = 'Unban a player by AWID',
    argsDescription = { 'awid' },
    restricted = true,
}, function(source, args)
    if not requireLevel(source, 2) then return end
    local targetAwid = args[1]
    if not targetAwid then return notify(source, 'Usage: /awadmin:unban <awid>') end
    local CoreDatabase = CoreAPI.GetSystem('Database')
    CoreDatabase.Execute('DELETE FROM aw_bans WHERE awid = ?', { targetAwid })
    notify(source, 'Unbanned: ' .. targetAwid)
    CoreLogger.Log('admin', 'info', 'Unban: ' .. targetAwid, { admin = getAWID(source) })
end)

-- ─── Teleport Command ───────────────────────────────────────────────
CoreCommands.Register('awadmin:tp', {
    description = 'Teleport to a player',
    argsDescription = { 'target (id/awid)' },
    restricted = true,
}, function(source, args)
    if not requireLevel(source, 2) then return end
    local targetSrc = getPlayerSource(args[1])
    if not targetSrc then return notify(source, 'Player not found.') end
    local targetPed = GetPlayerPed(targetSrc)
    local coords = GetEntityCoords(targetPed)
    TriggerClientEvent('aw:admin:teleport', source, coords.x, coords.y, coords.z)
    notify(source, 'Teleported to ' .. GetPlayerName(targetSrc))
end)

-- ─── Spawn Aircraft Command ─────────────────────────────────────────
CoreCommands.Register('awadmin:spawn', {
    description = 'Spawn an aircraft for yourself',
    argsDescription = { 'aircraft_type' },
    restricted = true,
}, function(source, args)
    if not requireLevel(source, 2) then return end
    local aircraftType = args[1]
    if not aircraftType then return notify(source, 'Usage: /awadmin:spawn <type>') end

    local ok, err = pcall(function()
        exports['aw-aircraft']:SpawnAircraft(source, aircraftType)
    end)
    if ok then
        notify(source, 'Spawned: ' .. aircraftType)
    else
        notify(source, 'Spawn failed: ' .. tostring(err))
    end
end)

-- ─── God Mode Command ───────────────────────────────────────────────
CoreCommands.Register('awadmin:god', {
    description = 'Toggle god mode',
    argsDescription = {},
    restricted = true,
}, function(source)
    if not requireLevel(source, 3) then return end
    local awid = getAWID(source)
    if MODULE_STATE.godmode[awid] then
        MODULE_STATE.godmode[awid] = nil
        TriggerClientEvent('aw:admin:godmode', source, false)
        notify(source, 'God mode OFF')
    else
        MODULE_STATE.godmode[awid] = true
        TriggerClientEvent('aw:admin:godmode', source, true)
        notify(source, 'God mode ON')
    end
end)

-- ─── Weather Command ────────────────────────────────────────────────
CoreCommands.Register('awadmin:weather', {
    description = 'Set weather type',
    argsDescription = { 'weather_type' },
    restricted = true,
}, function(source, args)
    if not requireLevel(source, 2) then return end
    local weatherType = args[1]
    if not weatherType then return notify(source, 'Usage: /awadmin:weather <type>') end
    local ok, err = pcall(function()
        exports['aw-world']:SetWeather(weatherType)
    end)
    if ok then
        broadcast('Weather set to: ' .. weatherType)
    else
        notify(source, 'Failed: ' .. tostring(err))
    end
end)

-- ─── Force Mission Command ──────────────────────────────────────────
CoreCommands.Register('awadmin:forcemission', {
    description = 'Force generate a mission of a specific type',
    argsDescription = { 'mission_type' },
    restricted = true,
}, function(source, args)
    if not requireLevel(source, 2) then return end
    local mType = args[1]
    if not mType then return notify(source, 'Usage: /awadmin:forcemission <type>') end
    local ok, err = pcall(function()
        exports['aw-mission']:GenerateMission(mType)
    end)
    if ok then
        broadcast('Mission generated: ' .. mType)
    else
        notify(source, 'Failed: ' .. tostring(err))
    end
end)

-- ─── Set Faction Command ────────────────────────────────────────────
CoreCommands.Register('awadmin:setfaction', {
    description = 'Force set a player faction',
    argsDescription = { 'target (id/awid)', 'faction_id' },
    restricted = true,
}, function(source, args)
    if not requireLevel(source, 2) then return end
    local targetSrc = getPlayerSource(args[1])
    if not targetSrc then return notify(source, 'Player not found.') end
    local factionId = args[2]
    if not factionId then return notify(source, 'Usage: /awadmin:setfaction <target> <faction>') end
    local ok, err = pcall(function()
        exports['aw-faction']:SetFaction(getAWID(targetSrc), factionId)
    end)
    if ok then
        notify(source, GetPlayerName(targetSrc) .. ' faction set to: ' .. factionId)
    else
        notify(source, 'Failed: ' .. tostring(err))
    end
end)

-- ─── Force End War Command ──────────────────────────────────────────
CoreCommands.Register('awadmin:endwar', {
    description = 'Force end current war round',
    argsDescription = {},
    restricted = true,
}, function(source)
    if not requireLevel(source, 3) then return end
    local ok, err = pcall(function()
        exports['aw-war']:ForceEndWar()
    end)
    if ok then
        broadcast('War forcefully ended by admin.')
    else
        notify(source, 'Failed: ' .. tostring(err))
    end
end)

-- ─── Spectate Command ───────────────────────────────────────────────
CoreCommands.Register('awadmin:spectate', {
    description = 'Spectate a player',
    argsDescription = { 'target (id/awid) or "stop"' },
    restricted = true,
}, function(source, args)
    if not requireLevel(source, 1) then return end
    local awid = getAWID(source)

    if args[1] == 'stop' then
        MODULE_STATE.spectating[awid] = nil
        TriggerClientEvent('aw:admin:spectate_stop', source)
        notify(source, 'Spectate stopped.')
        return
    end

    local targetSrc = getPlayerSource(args[1])
    if not targetSrc then return notify(source, 'Player not found.') end
    MODULE_STATE.spectating[awid] = getAWID(targetSrc)
    TriggerClientEvent('aw:admin:spectate', source, targetSrc)
    notify(source, 'Spectating: ' .. GetPlayerName(targetSrc))
end)

-- ─── Debug Info Command ─────────────────────────────────────────────
CoreCommands.Register('awadmin:debug', {
    description = 'Toggle debug overlay',
    argsDescription = {},
    restricted = true,
}, function(source)
    if not requireLevel(source, 3) then return end
    TriggerClientEvent('aw:admin:debug_toggle', source)
end)

-- ─── Server Info Command ────────────────────────────────────────────
CoreCommands.Register('awadmin:info', {
    description = 'Print server state info',
    argsDescription = {},
    restricted = true,
}, function(source)
    if not requireLevel(source, 1) then return end
    local playerCount = #GetPlayers()
    local warPhase = 'unknown'
    pcall(function() warPhase = exports['aw-war']:GetPhase() end)

    notify(source, string.format(
        'Players: %d | War Phase: %s | Uptime: %ds',
        playerCount, warPhase, math.floor(GetGameTimer() / 1000)
    ))
end)

-- ─── Godmode damage prevention ──────────────────────────────────────
CoreEvents.Subscribe(AW.EVENT and AW.EVENT.COMBAT_HIT or 'aw:combat:hit', function(data)
    local targetAwid = data.target_awid
    if MODULE_STATE.godmode[targetAwid] then
        -- Cancel damage by returning false (if combat module supports it)
        return false
    end
end)

-- ─── Player connected — refresh admin status ────────────────────────
CoreEvents.Subscribe(AW.EVENT and AW.EVENT.PLAYER_LOADED or 'aw:player:loaded', function(data)
    local src = data.source
    local awid = getAWID(src)
    if not awid then return end

    local hasSuperAdmin = CorePermissions.HasPermission(awid, 'admin.superadmin')
    local hasAdmin = CorePermissions.HasPermission(awid, 'admin.admin')
    local hasMod = CorePermissions.HasPermission(awid, 'admin.moderator')

    if hasSuperAdmin then
        MODULE_STATE.admins[awid] = { level = 3, source = src }
    elseif hasAdmin then
        MODULE_STATE.admins[awid] = { level = 2, source = src }
    elseif hasMod then
        MODULE_STATE.admins[awid] = { level = 1, source = src }
    end
end)

-- ─── Player disconnected — cleanup ──────────────────────────────────
CoreEvents.Subscribe(AW.EVENT and AW.EVENT.PLAYER_DROPPED or 'aw:player:dropped', function(data)
    local awid = data.awid
    MODULE_STATE.admins[awid] = nil
    MODULE_STATE.spectating[awid] = nil
    MODULE_STATE.godmode[awid] = nil
end)

-- ─── Initialization ─────────────────────────────────────────────────
CoreEvents.Subscribe(AW.EVENT and AW.EVENT.CORE_READY or 'aw:core:ready', function()
    loadAdmins()
    CoreLogger.Log('admin', 'info', '[aw-admin] Admin module initialized')
end)

CoreAPI.RegisterModule('aw-admin', { priority = 700 })

-- ─── Exports ─────────────────────────────────────────────────────────
exports('IsAdmin', isAdmin)
exports('GetAdminLevel', getAdminLevel)

exports('SpectatePlayer', function(adminSource, targetSource)
    if not requireLevel(adminSource, 1) then return false end
    TriggerClientEvent('aw:admin:spectate', adminSource, targetSource)
    return true
end)

exports('ForceEndWar', function()
    pcall(function() exports['aw-war']:ForceEndWar() end)
end)
