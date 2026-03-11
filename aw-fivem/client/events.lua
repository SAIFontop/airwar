-- ═══════════════════════════════════════════════════════════
-- Client Event Bus
-- ═══════════════════════════════════════════════════════════

Core.Events = {}

local _handlers = {}
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
    for i, h in ipairs(handlers) do
        pcall(h.fn, ...)
        if h.once then toRemove[#toRemove + 1] = i end
    end
    for i = #toRemove, 1, -1 do
        table.remove(handlers, toRemove[i])
    end
end
