--[[
    System 9: Logger
    Structured logging with multiple sinks (console, file, DB, Discord)
    First system to initialize — all other systems depend on it
]]

local Logger = {}
Logger.__index = Logger

local LEVELS = {
    DEBUG = { num = 0, label = 'DEBUG', color = '^5' },
    INFO  = { num = 1, label = 'INFO',  color = '^2' },
    WARN  = { num = 2, label = 'WARN',  color = '^3' },
    ERROR = { num = 3, label = 'ERROR', color = '^1' },
    FATAL = { num = 4, label = 'FATAL', color = '^1' },
}

local minLevel = LEVELS.DEBUG.num
local sinks = {}
local logBuffer = {}
local MAX_BUFFER = 500
local discordWebhook = nil

-- ============================================================
-- SINKS
-- ============================================================

--- Console sink (default)
local function consoleSink(entry)
    local level = LEVELS[entry.level] or LEVELS.INFO
    local prefix = level.color .. '[' .. level.label .. ']^0'
    local source = entry.source and ('^4[' .. entry.source .. ']^0 ') or ''
    print(string.format('%s %s%s', prefix, source, entry.message))
end

--- Database sink (batched — entries stored in buffer, flushed by scheduler)
local function dbSink(entry)
    logBuffer[#logBuffer + 1] = entry
    if #logBuffer >= MAX_BUFFER then
        Logger.FlushToDb()
    end
end

--- Discord webhook sink
local function discordSink(entry)
    if not discordWebhook then return end
    local level = LEVELS[entry.level] or LEVELS.INFO
    if level.num < LEVELS.WARN.num then return end -- Only WARN+ to Discord

    local color = level.num >= LEVELS.ERROR.num and 16711680 or 16776960 -- Red or Yellow
    local payload = json.encode({
        embeds = {{
            title = '[AIRWAR] ' .. level.label,
            description = entry.message,
            color = color,
            fields = entry.source and {{name = 'Source', value = entry.source, inline = true}} or nil,
            timestamp = os.date('!%Y-%m-%dT%H:%M:%SZ'),
        }}
    })

    PerformHttpRequest(discordWebhook, function() end, 'POST', payload, {['Content-Type'] = 'application/json'})
end

-- ============================================================
-- CORE API
-- ============================================================

--- Initialize the logger system
---@param config table { min_level?: string, discord_webhook?: string }
function Logger.Init(config)
    config = config or {}

    if config.min_level and LEVELS[config.min_level] then
        minLevel = LEVELS[config.min_level].num
    end

    discordWebhook = config.discord_webhook

    -- Register default sinks
    sinks = { consoleSink }

    -- DB sink added after database system is ready
    -- Discord sink added if webhook is configured
    if discordWebhook then
        sinks[#sinks + 1] = discordSink
    end

    Logger.Info('logger', 'Logger system initialized (min_level=%s)', config.min_level or 'DEBUG')
end

--- Enable database logging sink (called after DB system is ready)
function Logger.EnableDbSink()
    sinks[#sinks + 1] = dbSink
    Logger.Info('logger', 'Database log sink enabled')
end

--- Core log function
---@param level string
---@param source string
---@param message string
---@param ... any Format arguments
local function log(level, source, message, ...)
    local levelInfo = LEVELS[level]
    if not levelInfo or levelInfo.num < minLevel then return end

    -- Format message if args supplied
    if select('#', ...) > 0 then
        local ok, formatted = pcall(string.format, message, ...)
        if ok then message = formatted end
    end

    local entry = {
        level = level,
        source = source,
        message = message,
        timestamp = os.time(),
    }

    for _, sink in ipairs(sinks) do
        local ok, err = pcall(sink, entry)
        if not ok and sink ~= consoleSink then
            consoleSink({ level = 'ERROR', source = 'logger', message = 'Sink error: ' .. tostring(err) })
        end
    end
end

function Logger.Debug(source, message, ...) log('DEBUG', source, message, ...) end
function Logger.Info(source, message, ...)  log('INFO', source, message, ...)  end
function Logger.Warn(source, message, ...)  log('WARN', source, message, ...)  end
function Logger.Error(source, message, ...) log('ERROR', source, message, ...) end
function Logger.Fatal(source, message, ...) log('FATAL', source, message, ...) end

--- Flush buffered logs to database
function Logger.FlushToDb()
    if #logBuffer == 0 then return end
    local batch = logBuffer
    logBuffer = {}

    local values = {}
    local params = {}
    for i, entry in ipairs(batch) do
        values[#values + 1] = '(?, ?, ?, FROM_UNIXTIME(?))'
        params[#params + 1] = entry.level
        params[#params + 1] = entry.source or 'unknown'
        params[#params + 1] = entry.message
        params[#params + 1] = entry.timestamp
    end

    local sql = 'INSERT INTO ' .. AW.TABLE.LOGS .. ' (level, source, message, created_at) VALUES ' .. table.concat(values, ', ')
    MySQL.Async.execute(sql, params)
end

--- Get buffered log count
---@return number
function Logger.GetBufferCount()
    return #logBuffer
end

-- Export shortcuts for other resources
CoreLogger = Logger
