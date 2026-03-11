-- ═══════════════════════════════════════════════════════════
-- System 1: Logger
-- ═══════════════════════════════════════════════════════════

Core.Log = {}

local LEVELS = { debug = 0, info = 1, warn = 2, error = 3, fatal = 4 }
local COLORS = { debug = '^5', info = '^2', warn = '^3', error = '^1', fatal = '^1' }
local LABELS = { debug = 'DEBUG', info = 'INFO', warn = 'WARN', error = 'ERROR', fatal = 'FATAL' }
local _minLevel = LEVELS.info

local function log(level, tag, msg, ...)
    if LEVELS[level] < _minLevel then return end
    local text = type(msg) == 'string' and string.format(msg, ...) or tostring(msg)
    print(string.format('%s[%s] ^7[%s] %s^0', COLORS[level], LABELS[level], tag or 'core', text))
end

function Core.Log.SetLevel(level)
    _minLevel = LEVELS[level] or LEVELS.info
end

function Core.Log.Debug(tag, msg, ...) log('debug', tag, msg, ...) end
function Core.Log.Info(tag, msg, ...)  log('info', tag, msg, ...)  end
function Core.Log.Warn(tag, msg, ...)  log('warn', tag, msg, ...)  end
function Core.Log.Error(tag, msg, ...) log('error', tag, msg, ...) end
function Core.Log.Fatal(tag, msg, ...) log('fatal', tag, msg, ...) end

function Core.Log._init()
    Core.Log.Info('core', 'Logger initialized')
end
