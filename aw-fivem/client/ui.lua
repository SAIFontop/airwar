-- ═══════════════════════════════════════════════════════════
-- Client UI Manager (NUI bridge)
-- Core.UI.Open / Close / Send / Focus / Notify / Modal / Menu / etc.
-- ═══════════════════════════════════════════════════════════

Core.UI = {}
Core.UI.Menu    = {}
Core.UI.Context = {}

local _focused = false

local function send(msgType, data)
    SendNUIMessage({ type = msgType, data = data or {} })
end

-- ───────────────────────────────────────────────────────────
-- Core UI API
-- ───────────────────────────────────────────────────────────

function Core.UI.Open(component, data)
    send('open', { component = component, data = data })
    Core.UI.Focus(true)
end

function Core.UI.Close(component)
    send('close', { component = component })
    Core.UI.Focus(false)
end

function Core.UI.Send(msgType, data)
    send(msgType, data)
end

function Core.UI.Focus(state, cursor)
    _focused = state
    SetNuiFocus(state, cursor ~= false and state or false)
end

function Core.UI.IsFocused()
    return _focused
end

-- ───────────────────────────────────────────────────────────
-- Notifications
-- ───────────────────────────────────────────────────────────

function Core.UI.Notify(message, type, duration)
    send('notification', {
        message  = message,
        type     = type or 'info',
        duration = duration or 3000,
    })
end

-- ───────────────────────────────────────────────────────────
-- Modal
-- ───────────────────────────────────────────────────────────

function Core.UI.Modal(opts)
    send('modal', opts)
    Core.UI.Focus(true)
end

-- ───────────────────────────────────────────────────────────
-- Menu
-- ───────────────────────────────────────────────────────────

function Core.UI.Menu.Open(opts)
    send('menu:open', opts)
    Core.UI.Focus(true)
end

function Core.UI.Menu.Close()
    send('menu:close', {})
    Core.UI.Focus(false)
end

-- ───────────────────────────────────────────────────────────
-- Context Menu
-- ───────────────────────────────────────────────────────────

function Core.UI.Context.Open(opts)
    send('context:open', opts)
    Core.UI.Focus(true)
end

-- ───────────────────────────────────────────────────────────
-- Dialog / Input
-- ───────────────────────────────────────────────────────────

function Core.UI.Input(opts)
    send('dialog:open', opts)
    Core.UI.Focus(true)

    local p = promise.new()

    RegisterNUICallback('dialog:submit', function(data, cb)
        cb('ok')
        Core.UI.Focus(false)
        p:resolve(data)
    end)

    RegisterNUICallback('dialog:cancel', function(_, cb)
        cb('ok')
        Core.UI.Focus(false)
        p:resolve(nil)
    end)

    return Citizen.Await(p)
end

-- ───────────────────────────────────────────────────────────
-- Progress Bar
-- ───────────────────────────────────────────────────────────

function Core.UI.Progress(opts)
    send('progress', opts)
end

-- ───────────────────────────────────────────────────────────
-- NUI Callbacks
-- ───────────────────────────────────────────────────────────

RegisterNUICallback('close', function(data, cb)
    Core.UI.Focus(false)
    Core.Events.Emit('ui:closed', data)
    cb('ok')
end)

RegisterNUICallback('action', function(data, cb)
    Core.Events.Emit('ui:action', data)
    cb('ok')
end)
