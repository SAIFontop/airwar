--[[
    System 4: Event Bus
    Central event routing with middleware, priority, wildcards
]]

local Events = {}
Events.__index = Events

local listeners = {}   -- { [eventName] = { { priority, handler, source } } }
local interceptors = {} -- { [eventName] = { handler } } — can modify/block events
local eventCounts = {}  -- { [eventName] = count } — telemetry

-- ============================================================
-- CORE API
-- ============================================================

function Events.Init()
    CoreLogger.Info('events', 'Event bus initialized')
end

--- Register an event listener
---@param eventName string
---@param handler function
---@param priority number|nil Lower = earlier (default 100)
---@param source string|nil Module name
function Events.On(eventName, handler, priority, source)
    priority = priority or 100

    if not listeners[eventName] then
        listeners[eventName] = {}
    end

    local list = listeners[eventName]
    list[#list + 1] = {
        priority = priority,
        handler = handler,
        source = source or 'unknown',
    }

    -- Sort by priority
    table.sort(list, function(a, b) return a.priority < b.priority end)
end

--- Remove all listeners from a source for a specific event
---@param eventName string
---@param source string
function Events.Off(eventName, source)
    local list = listeners[eventName]
    if not list then return end

    for i = #list, 1, -1 do
        if list[i].source == source then
            table.remove(list, i)
        end
    end
end

--- Register an interceptor (can modify or block events)
---@param eventName string
---@param handler function (data) -> data|nil (nil = block)
function Events.Intercept(eventName, handler)
    if not interceptors[eventName] then
        interceptors[eventName] = {}
    end
    interceptors[eventName][#interceptors[eventName] + 1] = handler
end

--- Emit an event
---@param eventName string
---@param data table|nil Event payload
---@return boolean Whether the event was delivered (not blocked)
function Events.Emit(eventName, data)
    data = data or {}

    -- Track telemetry
    eventCounts[eventName] = (eventCounts[eventName] or 0) + 1

    -- Run interceptors
    if interceptors[eventName] then
        for _, interceptor in ipairs(interceptors[eventName]) do
            local result = interceptor(data)
            if result == nil or result == false then
                CoreLogger.Debug('events', 'Event "%s" blocked by interceptor', eventName)
                return false
            end
            if type(result) == 'table' then
                data = result
            end
        end
    end

    -- Deliver to listeners
    local list = listeners[eventName]
    if list then
        for _, listener in ipairs(list) do
            local ok, err = pcall(listener.handler, data)
            if not ok then
                CoreLogger.Error('events', 'Event "%s" handler from "%s" error: %s', eventName, listener.source, tostring(err))
            end
        end
    end

    -- Wildcard listeners (e.g., "aw:combat:*" matches "aw:combat:fired")
    for pattern, patternListeners in pairs(listeners) do
        if pattern:find('%*') then
            local regexPattern = pattern:gsub('%*', '.*')
            if eventName:match('^' .. regexPattern .. '$') and pattern ~= eventName then
                for _, listener in ipairs(patternListeners) do
                    local ok, err = pcall(listener.handler, data)
                    if not ok then
                        CoreLogger.Error('events', 'Wildcard handler "%s" error: %s', pattern, tostring(err))
                    end
                end
            end
        end
    end

    return true
end

--- Emit event and also trigger FiveM native event (for cross-resource)
---@param eventName string
---@param data table|nil
function Events.EmitNative(eventName, data)
    if Events.Emit(eventName, data) then
        TriggerEvent(eventName, data)
    end
end

--- Emit to specific client
---@param eventName string
---@param serverId number
---@param data table|nil
function Events.EmitClient(eventName, serverId, data)
    TriggerClientEvent(eventName, serverId, data)
end

--- Emit to all clients
---@param eventName string
---@param data table|nil
function Events.EmitAllClients(eventName, data)
    TriggerClientEvent(eventName, -1, data)
end

-- ============================================================
-- TELEMETRY
-- ============================================================

---@return table
function Events.GetStats()
    return {
        listeners = Utils.TableCount(listeners),
        interceptors = Utils.TableCount(interceptors),
        events_fired = eventCounts,
    }
end

--- Get total events per second (approximate)
---@return number
function Events.GetEventsPerSecond()
    local total = 0
    for _, count in pairs(eventCounts) do
        total = total + count
    end
    return total
end

--- Reset counters
function Events.ResetCounters()
    eventCounts = {}
end

CoreEvents = Events
