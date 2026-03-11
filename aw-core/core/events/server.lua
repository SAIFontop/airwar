-- ═══════════════════════════════════════════════════════════
-- System 7: Internal Event Bus
-- Decoupled publish/subscribe, NOT net events
-- ═══════════════════════════════════════════════════════════

Core.Events = {}

local _handlers = {} -- { [event] = { { id, fn, once } } }
local _nextId = 1

function Core.Events.On(event, fn)
    if not _handlers[event] then _handlers[event] = {} end
    local id = _nextId
    _nextId = _nextId + 1
    _handlers[event][#_handlers[event] + 1] = { id = id, fn = fn, once = false }
    return id
end

function Core.Events.Once(event, fn)
    if not _handlers[event] then _handlers[event] = {} end
    local id = _nextId
    _nextId = _nextId + 1
    _handlers[event][#_handlers[event] + 1] = { id = id, fn = fn, once = true }
    return id
end

function Core.Events.Off(id)
    for _, handlers in pairs(_handlers) do
        for i = #handlers, 1, -1 do
            if handlers[i].id == id then
                table.remove(handlers, i)
                return true
            end
        end
    end
    return false
end

function Core.Events.Emit(event, ...)
    local handlers = _handlers[event]
    if not handlers then return end
    local toRemove = {}
    for i, handler in ipairs(handlers) do
        Core.Error.Try(handler.fn, ...)
        if handler.once then toRemove[#toRemove + 1] = i end
    end
    for i = #toRemove, 1, -1 do
        table.remove(handlers, toRemove[i])
    end
end

function Core.Events._init()
    Core.Log.Info('core', 'Event bus initialized')
end
