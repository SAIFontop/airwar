--[[
    Client Events
    Client-side event bus — mirrors server event system for local client events
    and handles NUI callback routing
]]

ClientEvents = {}

local listeners = {} -- { [eventName] = { { handler, priority } } }

function ClientEvents.Init()
    -- NUI callback handler
    RegisterNUICallback('nui_event', function(data, cb)
        local eventName = data.event
        if eventName then
            ClientEvents.Emit('NUI.' .. eventName, data.payload)
        end
        cb('ok')
    end)

    -- NUI action → server request bridge
    RegisterNUICallback('server_request', function(data, cb)
        local callbackName = data.callback
        if callbackName then
            local success, result = ClientCallbacks.CallServer(callbackName, data.payload)
            cb({ success = success, data = result })
        else
            cb({ success = false, data = 'Missing callback name' })
        end
    end)

    CoreLogger.Info('client:events', 'Client event system initialized')
end

--- Register a client-side event listener
---@param eventName string
---@param handler function
---@param priority number|nil Lower = earlier (default 50)
function ClientEvents.On(eventName, handler, priority)
    if not listeners[eventName] then
        listeners[eventName] = {}
    end
    listeners[eventName][#listeners[eventName] + 1] = {
        handler  = handler,
        priority = priority or 50,
    }
    -- Sort by priority
    table.sort(listeners[eventName], function(a, b) return a.priority < b.priority end)
end

--- Remove a listener
---@param eventName string
---@param handler function
function ClientEvents.Off(eventName, handler)
    local list = listeners[eventName]
    if not list then return end
    for i = #list, 1, -1 do
        if list[i].handler == handler then
            table.remove(list, i)
            break
        end
    end
end

--- Emit a client-side event
---@param eventName string
---@param data any
function ClientEvents.Emit(eventName, data)
    local list = listeners[eventName]
    if not list then return end

    for _, entry in ipairs(list) do
        local ok, err = pcall(entry.handler, data)
        if not ok then
            CoreLogger.Error('client:events', 'Event "%s" handler error: %s', eventName, tostring(err))
        end
    end
end
