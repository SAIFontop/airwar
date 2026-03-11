--[[
    aw-log — Server-side Log & Telemetry Engine
    
    Responsibilities:
    1. Game event logging (kills, bans, missions, war phases)
    2. Discord webhook notifications (configurable per event type)
    3. Performance counters (events/sec, DB writes, entity count, tick time)
    4. Match history compilation (post-war summary)
    5. Log search/query via exports
]]

-- ============================================================
-- MODULE STATE
-- ============================================================

local AWLog = {}
local initialized = false

-- Discord webhook URLs (loaded from aw-config server settings)
local webhooks = {
    kills    = nil, -- Kill feed channel
    admin    = nil, -- Admin actions channel
    missions = nil, -- Mission completions channel
    war      = nil, -- War phase changes channel
    errors   = nil, -- Server errors channel
    general  = nil, -- Catch-all channel
}

-- Performance counters
local counters = {
    events_total       = 0,
    events_per_second  = 0,
    kills_total        = 0,
    deaths_total       = 0,
    missions_completed = 0,
    missions_failed    = 0,
    zones_captured     = 0,
    aircraft_spawned   = 0,
    aircraft_destroyed = 0,
    players_connected  = 0,
    players_peak       = 0,
    uptime_seconds     = 0,
}

-- Rate tracking for events/sec
local eventCountThisSecond = 0
local lastSecondTick = 0

-- Match (war cycle) history
local currentMatch = {
    started_at     = 0,
    kills          = {},
    missions       = {},
    zone_changes   = {},
    faction_scores = {},
    phase_changes  = {},
}

local matchHistory = {}
local MAX_MATCH_HISTORY = 10

-- Event log buffer (for DB writes)
local eventBuffer = {}
local MAX_EVENT_BUFFER = 100

-- Discord rate limiter
local discordQueue = {}
local DISCORD_RATE_LIMIT = 2000 -- ms between Discord messages per webhook
local lastDiscordSend = {}

-- ============================================================
-- DISCORD INTEGRATION
-- ============================================================

local EMBED_COLORS = {
    kill     = 0xFF4444, -- Red
    death    = 0x888888, -- Gray
    mission  = 0x44FF44, -- Green
    war      = 0xFFD700, -- Gold
    admin    = 0xFF8800, -- Orange
    error    = 0xFF0000, -- Bright red
    info     = 0x4488FF, -- Blue
    faction  = 0x8844FF, -- Purple
    zone     = 0x44FFFF, -- Cyan
    economy  = 0x00FF88, -- Teal
}

--- Send a Discord webhook message
---@param channel string Webhook channel key
---@param title string Embed title
---@param description string Embed description
---@param color number Embed color
---@param fields table|nil Array of {name, value, inline} field objects
local function sendDiscord(channel, title, description, color, fields)
    local url = webhooks[channel] or webhooks.general
    if not url then return end

    -- Rate limiting per channel
    local now = GetGameTimer()
    if lastDiscordSend[channel] and (now - lastDiscordSend[channel]) < DISCORD_RATE_LIMIT then
        -- Queue for later
        discordQueue[#discordQueue + 1] = {
            channel = channel, title = title, description = description,
            color = color, fields = fields, queued_at = now,
        }
        return
    end

    lastDiscordSend[channel] = now

    local embed = {
        title       = '[AIRWAR] ' .. title,
        description = description,
        color       = color or EMBED_COLORS.info,
        timestamp   = os.date('!%Y-%m-%dT%H:%M:%SZ'),
        footer      = { text = 'AIRWAR v' .. AW.VERSION.STRING },
    }

    if fields and #fields > 0 then
        embed.fields = fields
    end

    local payload = json.encode({ embeds = { embed } })
    PerformHttpRequest(url, function(code)
        if code >= 400 then
            CoreLogger.Warn('aw-log', 'Discord webhook failed (channel=%s, code=%d)', channel, code)
        end
    end, 'POST', payload, { ['Content-Type'] = 'application/json' })
end

--- Process queued Discord messages
local function processDiscordQueue()
    if #discordQueue == 0 then return end

    local now = GetGameTimer()
    local remaining = {}

    for _, msg in ipairs(discordQueue) do
        -- Drop messages older than 30 seconds
        if (now - msg.queued_at) > 30000 then
            goto continue
        end

        if not lastDiscordSend[msg.channel] or (now - lastDiscordSend[msg.channel]) >= DISCORD_RATE_LIMIT then
            sendDiscord(msg.channel, msg.title, msg.description, msg.color, msg.fields)
        else
            remaining[#remaining + 1] = msg
        end

        ::continue::
    end

    discordQueue = remaining
end

-- ============================================================
-- EVENT LOGGING (DB)
-- ============================================================

--- Log a game event to buffer (flushed to DB periodically)
---@param eventType string Event type identifier
---@param source string|nil Source (player AWID or system)
---@param data table|nil Event-specific data
local function logEventToDb(eventType, source, data)
    eventBuffer[#eventBuffer + 1] = {
        event_type = eventType,
        source     = source or 'system',
        data       = data and json.encode(data) or nil,
        timestamp  = os.time(),
    }

    if #eventBuffer >= MAX_EVENT_BUFFER then
        AWLog.FlushEventBuffer()
    end
end

--- Flush event buffer to database
function AWLog.FlushEventBuffer()
    if #eventBuffer == 0 then return end
    if not CoreDatabase then return end

    local batch = eventBuffer
    eventBuffer = {}

    local values = {}
    local params = {}
    for _, entry in ipairs(batch) do
        values[#values + 1] = '(?, ?, ?, FROM_UNIXTIME(?))'
        params[#params + 1] = entry.event_type
        params[#params + 1] = entry.source
        params[#params + 1] = entry.data
        params[#params + 1] = entry.timestamp
    end

    local sql = 'INSERT INTO ' .. AW.TABLE.LOGS .. ' (level, source, message, created_at) VALUES ' .. table.concat(values, ', ')

    if MySQL and MySQL.Async then
        MySQL.Async.execute(sql, params)
    end
end

-- ============================================================
-- PERFORMANCE COUNTERS
-- ============================================================

--- Increment a named counter
---@param name string Counter name
---@param amount number|nil Increment amount (default 1)
local function incrementCounter(name, amount)
    amount = amount or 1
    if counters[name] then
        counters[name] = counters[name] + amount
    end
    counters.events_total = counters.events_total + 1
    eventCountThisSecond = eventCountThisSecond + 1
end

--- Update events/sec counter (called every second)
local function updateEventsPerSecond()
    counters.events_per_second = eventCountThisSecond
    eventCountThisSecond = 0
    counters.uptime_seconds = counters.uptime_seconds + 1
end

--- Collect runtime performance snapshot
---@return table Performance data
local function collectPerformanceSnapshot()
    local playerCount = #GetPlayers()
    counters.players_connected = playerCount
    if playerCount > counters.players_peak then
        counters.players_peak = playerCount
    end

    return {
        counters       = Utils.DeepCopy(counters),
        entity_count   = GetNumPlayerIndices and #GetPlayers() or 0,
        server_time    = os.time(),
        uptime         = counters.uptime_seconds,
        event_buffer   = #eventBuffer,
        discord_queue  = #discordQueue,
    }
end

-- ============================================================
-- MATCH HISTORY
-- ============================================================

--- Start tracking a new match/war cycle
local function startNewMatch()
    currentMatch = {
        started_at     = os.time(),
        kills          = {},
        missions       = {},
        zone_changes   = {},
        faction_scores = {},
        phase_changes  = {},
    }
end

--- Finalize current match and push to history
---@param victorFaction string|nil Winning faction ID
---@param reason string|nil Victory reason
local function finalizeMatch(victorFaction, reason)
    currentMatch.ended_at = os.time()
    currentMatch.duration = currentMatch.ended_at - currentMatch.started_at
    currentMatch.victor   = victorFaction
    currentMatch.reason   = reason
    currentMatch.final_counters = {
        kills    = counters.kills_total,
        deaths   = counters.deaths_total,
        missions = counters.missions_completed,
        zones    = counters.zones_captured,
    }

    -- Push to history, trim if needed
    matchHistory[#matchHistory + 1] = Utils.DeepCopy(currentMatch)
    if #matchHistory > MAX_MATCH_HISTORY then
        table.remove(matchHistory, 1)
    end

    -- Log to DB
    logEventToDb('match_ended', nil, {
        victor   = victorFaction,
        reason   = reason,
        duration = currentMatch.duration,
        kills    = #currentMatch.kills,
        missions = #currentMatch.missions,
    })

    -- Discord notification
    local fields = {
        { name = 'Victor', value = victorFaction or 'Draw', inline = true },
        { name = 'Duration', value = Utils.FormatTime(currentMatch.duration), inline = true },
        { name = 'Total Kills', value = tostring(#currentMatch.kills), inline = true },
        { name = 'Missions', value = tostring(#currentMatch.missions), inline = true },
    }
    sendDiscord('war', 'War Ended', reason or 'The war has concluded.', EMBED_COLORS.war, fields)

    -- Reset counters for next match
    counters.kills_total = 0
    counters.deaths_total = 0
    counters.missions_completed = 0
    counters.missions_failed = 0
    counters.zones_captured = 0

    startNewMatch()
end

-- ============================================================
-- EVENT HANDLERS (subscribe to Core events)
-- ============================================================

--- Kill event
AddEventHandler(AW.EVENT.KILL, function(data)
    incrementCounter('kills_total')

    -- Track in current match
    currentMatch.kills[#currentMatch.kills + 1] = {
        attacker      = data.attacker_awid,
        victim        = data.victim_awid,
        weapon        = data.weapon,
        distance      = data.distance,
        attacker_acft = data.attacker_aircraft,
        victim_acft   = data.victim_aircraft,
        timestamp     = os.time(),
    }

    -- DB log
    logEventToDb('kill', data.attacker_awid, {
        victim   = data.victim_awid,
        weapon   = data.weapon,
        aircraft = data.attacker_aircraft,
        target   = data.victim_aircraft,
        distance = data.distance,
    })

    -- Discord
    local desc = string.format('**%s** (%s) shot down **%s** (%s) with %s',
        data.attacker_name or data.attacker_awid or '?',
        data.attacker_aircraft or '?',
        data.victim_name or data.victim_awid or '?',
        data.victim_aircraft or '?',
        data.weapon or '?'
    )
    sendDiscord('kills', 'Air Kill', desc, EMBED_COLORS.kill, {
        { name = 'Distance', value = string.format('%.0fm', data.distance or 0), inline = true },
    })
end)

--- Aircraft destroyed
AddEventHandler(AW.EVENT.AIRCRAFT_DESTROYED, function(data)
    incrementCounter('aircraft_destroyed')
    incrementCounter('deaths_total')

    logEventToDb('aircraft_destroyed', data.owner_awid, {
        aircraft = data.aircraft_type,
        cause    = data.cause,
    })
end)

--- Aircraft spawned
AddEventHandler(AW.EVENT.AIRCRAFT_SPAWNED, function(data)
    incrementCounter('aircraft_spawned')
end)

--- Mission completed
AddEventHandler(AW.EVENT.MISSION_COMPLETED, function(data)
    incrementCounter('missions_completed')

    currentMatch.missions[#currentMatch.missions + 1] = {
        mission_id = data.mission_id,
        type       = data.mission_type,
        faction    = data.faction,
        players    = data.player_count,
        timestamp  = os.time(),
    }

    logEventToDb('mission_completed', nil, {
        mission_id = data.mission_id,
        type       = data.mission_type,
        faction    = data.faction,
    })

    sendDiscord('missions', 'Mission Complete',
        string.format('**%s** completed by %s (%d pilots)',
            data.mission_display or data.mission_type or '?',
            data.faction or '?',
            data.player_count or 0
        ),
        EMBED_COLORS.mission
    )
end)

--- Mission failed
AddEventHandler(AW.EVENT.MISSION_FAILED, function(data)
    incrementCounter('missions_failed')

    logEventToDb('mission_failed', nil, {
        mission_id = data.mission_id,
        type       = data.mission_type,
        reason     = data.reason,
    })
end)

--- Zone captured
AddEventHandler(AW.EVENT.ZONE_CAPTURED, function(data)
    incrementCounter('zones_captured')

    currentMatch.zone_changes[#currentMatch.zone_changes + 1] = {
        zone      = data.zone_id,
        faction   = data.faction,
        timestamp = os.time(),
    }

    logEventToDb('zone_captured', nil, {
        zone    = data.zone_id,
        faction = data.faction,
    })

    sendDiscord('war', 'Zone Captured',
        string.format('**%s** captured zone **%s**', data.faction or '?', data.zone_display or data.zone_id or '?'),
        EMBED_COLORS.zone
    )
end)

--- War phase changed
AddEventHandler(AW.EVENT.WAR_PHASE_CHANGED, function(data)
    currentMatch.phase_changes[#currentMatch.phase_changes + 1] = {
        from      = data.from_phase,
        to        = data.to_phase,
        timestamp = os.time(),
    }

    logEventToDb('war_phase', nil, {
        from = data.from_phase,
        to   = data.to_phase,
    })

    sendDiscord('war', 'War Phase Change',
        string.format('War phase: **%s** → **%s**', data.from_phase or '?', data.to_phase or '?'),
        EMBED_COLORS.war
    )
end)

--- War ended
AddEventHandler(AW.EVENT.WAR_ENDED, function(data)
    finalizeMatch(data.victor, data.reason)
end)

--- War reset
AddEventHandler(AW.EVENT.WAR_RESET, function()
    startNewMatch()
end)

--- Player joined
AddEventHandler(AW.EVENT.PLAYER_JOINED, function(data)
    incrementCounter('players_connected')

    logEventToDb('player_joined', data.awid, {
        name      = data.name,
        source    = data.source,
        identifiers = data.identifiers,
    })
end)

--- Player dropped
AddEventHandler(AW.EVENT.PLAYER_DROPPED, function(data)
    logEventToDb('player_dropped', data.awid, {
        name   = data.name,
        reason = data.reason,
    })
end)

--- Player banned
AddEventHandler(AW.EVENT.PLAYER_BANNED, function(data)
    logEventToDb('player_banned', data.awid, {
        reason = data.reason,
        admin  = data.admin_awid,
        expiry = data.expiry,
    })

    sendDiscord('admin', 'Player Banned',
        string.format('**%s** was banned by %s\nReason: %s',
            data.name or data.awid or '?',
            data.admin_name or data.admin_awid or 'System',
            data.reason or 'No reason'
        ),
        EMBED_COLORS.admin
    )
end)

--- Admin action
AddEventHandler(AW.EVENT.ADMIN_ACTION, function(data)
    logEventToDb('admin_action', data.admin_awid, {
        action = data.action,
        target = data.target_awid,
        params = data.params,
    })

    sendDiscord('admin', 'Admin Action',
        string.format('**%s** performed: %s',
            data.admin_name or data.admin_awid or '?',
            data.action or '?'
        ),
        EMBED_COLORS.admin,
        data.target_awid and {
            { name = 'Target', value = data.target_name or data.target_awid, inline = true },
        } or nil
    )
end)

--- Faction score changed
AddEventHandler(AW.EVENT.FACTION_SCORE_CHANGED, function(data)
    currentMatch.faction_scores[data.faction_id] = data.new_score
end)

--- Economy: large purchase
AddEventHandler(AW.EVENT.ITEM_PURCHASED, function(data)
    logEventToDb('purchase', data.awid, {
        item  = data.item_id,
        type  = data.item_type,
        price = data.price,
    })
end)

-- ============================================================
-- INITIALIZATION
-- ============================================================

local function loadWebhookConfig()
    -- Try to get from aw-config server settings
    local ok, config = pcall(function()
        return exports['aw-config']:GetConfigValue('server.discord')
    end)

    if ok and config then
        webhooks.kills    = config.webhook_kills
        webhooks.admin    = config.webhook_admin
        webhooks.missions = config.webhook_missions
        webhooks.war      = config.webhook_war
        webhooks.errors   = config.webhook_errors
        webhooks.general  = config.webhook_general
    end

    -- Fall back to convars
    if not webhooks.general then
        webhooks.general  = GetConvar('aw_discord_webhook', '')
        if webhooks.general == '' then webhooks.general = nil end
    end
    if not webhooks.kills then
        webhooks.kills = GetConvar('aw_discord_kills', '')
        if webhooks.kills == '' then webhooks.kills = nil end
    end
    if not webhooks.admin then
        webhooks.admin = GetConvar('aw_discord_admin', '')
        if webhooks.admin == '' then webhooks.admin = nil end
    end
end

--- Module registration with aw-core
AddEventHandler(AW.EVENT.CORE_READY, function()
    if initialized then return end
    initialized = true

    -- Register this module with Core
    if CoreAPI and CoreAPI.RegisterModule then
        CoreAPI.RegisterModule({
            name     = 'aw-log',
            version  = '1.0.0',
            priority = 900, -- High priority, early init
        })
    end

    -- Load Discord webhook config
    loadWebhookConfig()

    -- Start match tracking
    startNewMatch()

    CoreLogger.Info('aw-log', 'Log & Telemetry module initialized')
    if webhooks.general then
        CoreLogger.Info('aw-log', 'Discord webhooks configured')
        sendDiscord('general', 'Server Started', 'AIRWAR server has started.', EMBED_COLORS.info)
    else
        CoreLogger.Warn('aw-log', 'No Discord webhooks configured — Discord logging disabled')
    end
end)

-- ============================================================
-- PERIODIC TASKS
-- ============================================================

-- Events/sec counter — runs every 1 second
CreateThread(function()
    while true do
        Wait(1000)
        updateEventsPerSecond()
    end
end)

-- Event buffer flush — runs every 10 seconds
CreateThread(function()
    while true do
        Wait(10000)
        AWLog.FlushEventBuffer()
    end
end)

-- Discord queue processor — runs every 2 seconds
CreateThread(function()
    while true do
        Wait(2000)
        processDiscordQueue()
    end
end)

-- Performance snapshot logging — runs every 60 seconds
CreateThread(function()
    -- Wait for init
    while not initialized do Wait(1000) end

    while true do
        Wait(60000)
        local snapshot = collectPerformanceSnapshot()
        logEventToDb('perf_snapshot', nil, snapshot.counters)

        -- Warn if entity count is high
        if snapshot.counters.players_connected > 0 then
            CoreLogger.Debug('aw-log', 'Perf: %d players, %d events/s, uptime %s',
                snapshot.counters.players_connected,
                snapshot.counters.events_per_second,
                Utils.FormatTime(snapshot.counters.uptime_seconds)
            )
        end
    end
end)

-- ============================================================
-- EXPORTS
-- ============================================================

--- Log a custom event from another resource
---@param eventType string Event type identifier
---@param source string|nil Source identifier
---@param data table|nil Event data
---@param discordChannel string|nil Optional Discord channel to notify
---@param discordTitle string|nil Discord embed title
exports('LogEvent', function(eventType, source, data, discordChannel, discordTitle)
    logEventToDb(eventType, source, data)

    if discordChannel and discordTitle then
        local desc = ''
        if data and data.message then
            desc = data.message
        elseif data then
            desc = json.encode(data)
        end
        sendDiscord(discordChannel, discordTitle, desc, EMBED_COLORS.info)
    end
end)

--- Get current performance statistics
---@return table Performance snapshot
exports('GetPerformanceStats', function()
    return collectPerformanceSnapshot()
end)

--- Get match history
---@return table Array of past match summaries
exports('GetMatchHistory', function()
    return Utils.DeepCopy(matchHistory)
end)

-- ============================================================
-- RESOURCE CLEANUP
-- ============================================================

AddEventHandler('onResourceStop', function(resource)
    if resource ~= GetCurrentResourceName() then return end

    -- Flush remaining events
    AWLog.FlushEventBuffer()

    -- Notify Discord
    sendDiscord('general', 'Server Stopping', 'AIRWAR log module shutting down.', EMBED_COLORS.info)
end)
