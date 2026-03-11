--[[
    aw-hud — Client NUI Bridge
    
    Responsibilities:
    1. Receive state from game modules via events & SendNUIMessage
    2. Forward NUI callbacks (user actions) to server
    3. Panel visibility management (show/hide panels)
    4. Aggregate state for throttled push to NUI
]]

-- ============================================================
-- STATE
-- ============================================================

local isHudVisible = false
local openPanels = {}  -- panelId → true

-- Panel visibility keybinds
local KEYBINDS = {
    -- M = War Map
    { control = 244, panel = 'warMap' },
    -- TAB = Scoreboard (held)
    { control = 37, panel = 'scoreboard', hold = true },
    -- F2 = Dashboard
    { control = 289, panel = 'dashboard' },
    -- F3 = Hangar (only when grounded)
    { control = 170, panel = 'hangar' },
    -- F4 = Mission Board
    { control = 171, panel = 'missionBoard' },
    -- F5 = Squadron Panel
    { control = 166, panel = 'squadronPanel' },
}

-- ============================================================
-- NUI MESSAGE DISPATCH
-- ============================================================

--- Send a typed message to the NUI
---@param msgType string
---@param data table
function PushNUI(msgType, data)
    SendNUIMessage({
        type = msgType,
        data = data,
    })
end

-- ============================================================
-- INCOMING STATE FROM MODULES
-- ============================================================

--- Generic UI state update from core pipeline
RegisterNetEvent('aw:ui:update')
AddEventHandler('aw:ui:update', function(payload)
    if not payload then return end
    -- payload: { panel = 'hud', state = { ... } }
    PushNUI('state_update', payload)
end)

--- HUD flight data (from aw-aircraft / aw-loadout)
RegisterNetEvent('aw:hud:flight_data')
AddEventHandler('aw:hud:flight_data', function(data)
    PushNUI('flight_data', data)
end)

--- Radar update (from aw-targeting)
RegisterNetEvent('aw:targeting:contacts_update')
AddEventHandler('aw:targeting:contacts_update', function(contacts)
    -- Already handled in aw-targeting client, but also relay to NUI
end)

--- Kill feed (from aw-combat)
RegisterNetEvent('aw:combat:kill_feed')
AddEventHandler('aw:combat:kill_feed', function(data)
    PushNUI('kill_feed', data)
end)

--- War state (from aw-war)
RegisterNetEvent('aw:war:state_update')
AddEventHandler('aw:war:state_update', function(data)
    PushNUI('war_state', data)
end)

RegisterNetEvent('aw:war:phase_changed')
AddEventHandler('aw:war:phase_changed', function(data)
    PushNUI('war_phase', data)
end)

RegisterNetEvent('aw:war:victory')
AddEventHandler('aw:war:victory', function(data)
    PushNUI('war_victory', data)
end)

--- Mission updates (from aw-mission)
RegisterNetEvent('aw:mission:available')
AddEventHandler('aw:mission:available', function(data)
    PushNUI('mission_available', data)
end)

RegisterNetEvent('aw:mission:started')
AddEventHandler('aw:mission:started', function(data)
    PushNUI('mission_started', data)
end)

RegisterNetEvent('aw:mission:completed')
AddEventHandler('aw:mission:completed', function(data)
    PushNUI('mission_completed', data)
end)

RegisterNetEvent('aw:mission:failed')
AddEventHandler('aw:mission:failed', function(data)
    PushNUI('mission_failed', data)
end)

--- Respawn timer (from aw-respawn)
RegisterNetEvent('aw:respawn:timer_update')
-- Already handled in aw-respawn client, NUI messages sent directly

--- Squadron (from aw-squadron)
RegisterNetEvent('aw:squadron:update')
AddEventHandler('aw:squadron:update', function(data)
    PushNUI('squadron_update', data)
end)

-- ============================================================
-- NUI CALLBACKS (User Actions → Server)
-- ============================================================

--- Generic action router
RegisterNUICallback('uiAction', function(data, cb)
    if not data or not data.action then
        cb({ ok = false, error = 'No action' })
        return
    end

    TriggerServerEvent('aw:ui:action', {
        action = data.action,
        data   = data.data,
    })

    cb({ ok = true })
end)

--- Panel-specific callbacks
RegisterNUICallback('selectAircraft', function(data, cb)
    TriggerServerEvent('aw:aircraft:request_spawn', data)
    cb({ ok = true })
end)

RegisterNUICallback('joinMission', function(data, cb)
    TriggerServerEvent('aw:mission:request_join', data)
    cb({ ok = true })
end)

RegisterNUICallback('leaveMission', function(data, cb)
    TriggerServerEvent('aw:mission:request_leave', data)
    cb({ ok = true })
end)

RegisterNUICallback('purchaseItem', function(data, cb)
    TriggerServerEvent('aw:store:purchase', data)
    cb({ ok = true })
end)

RegisterNUICallback('closePanel', function(data, cb)
    if data and data.panel then
        closePanel(data.panel)
    end
    cb({ ok = true })
end)

RegisterNUICallback('respawn_select_aircraft', function(data, cb)
    -- Forward to respawn client (already handled in aw-respawn)
    TriggerServerEvent('aw:respawn:request_spawn', data)
    SetNuiFocus(false, false)
    cb({ ok = true })
end)

-- ============================================================
-- PANEL MANAGEMENT
-- ============================================================

function openPanel(panelId)
    openPanels[panelId] = true
    PushNUI('panel_visibility', { panel = panelId, visible = true })

    -- Focus NUI for interactive panels
    local interactive = { hangar = true, dashboard = true, missionBoard = true, squadronPanel = true, adminPanel = true }
    if interactive[panelId] then
        SetNuiFocus(true, true)
    end
end

function closePanel(panelId)
    openPanels[panelId] = nil
    PushNUI('panel_visibility', { panel = panelId, visible = false })

    -- Release focus if no interactive panels open
    local anyInteractive = false
    local interactive = { hangar = true, dashboard = true, missionBoard = true, squadronPanel = true, adminPanel = true }
    for pid, _ in pairs(openPanels) do
        if interactive[pid] then
            anyInteractive = true
            break
        end
    end
    if not anyInteractive then
        SetNuiFocus(false, false)
    end
end

function togglePanel(panelId)
    if openPanels[panelId] then
        closePanel(panelId)
    else
        openPanel(panelId)
    end
end

-- ============================================================
-- AIRCRAFT EVENTS
-- ============================================================

AddEventHandler(AW.EVENT.AIRCRAFT_SPAWNED, function(data)
    isHudVisible = true
    PushNUI('hud_visibility', { visible = true })
end)

AddEventHandler(AW.EVENT.AIRCRAFT_DESTROYED, function()
    isHudVisible = false
    PushNUI('hud_visibility', { visible = false })
end)

AddEventHandler(AW.EVENT.AIRCRAFT_DESPAWNED, function()
    isHudVisible = false
    PushNUI('hud_visibility', { visible = false })
end)

-- ============================================================
-- INPUT LOOP
-- ============================================================

CreateThread(function()
    while true do
        Wait(0)

        for _, bind in ipairs(KEYBINDS) do
            if bind.hold then
                -- Show while held
                if IsControlPressed(0, bind.control) then
                    if not openPanels[bind.panel] then
                        openPanel(bind.panel)
                    end
                else
                    if openPanels[bind.panel] then
                        closePanel(bind.panel)
                    end
                end
            else
                if IsControlJustPressed(0, bind.control) then
                    togglePanel(bind.panel)
                end
            end
        end

        -- ESC to close all panels
        if IsControlJustPressed(0, 200) then
            for panelId, _ in pairs(openPanels) do
                closePanel(panelId)
            end
        end
    end
end)

-- ============================================================
-- CLEANUP
-- ============================================================

AddEventHandler('onResourceStop', function(resource)
    if resource ~= GetCurrentResourceName() then return end
    SetNuiFocus(false, false)
end)
