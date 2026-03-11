--[[
    Client Boot
    Initializes client-side Core systems and reports ready to server
]]

local clientReady = false
local playerData = nil

-- ============================================================
-- CLIENT SYSTEMS INIT
-- ============================================================

CreateThread(function()
    -- Wait for the game to fully load
    while not NetworkIsSessionStarted() do
        Wait(100)
    end

    -- Init client systems
    ClientCallbacks.Init()
    ClientState.Init()
    ClientEvents.Init()

    clientReady = true

    -- Notify server that client is loaded
    TriggerServerEvent(AW.EVENT.PLAYER_LOADED)

    CoreLogger.Info('client:boot', 'Client boot complete')
end)

-- ============================================================
-- RECEIVE PLAYER DATA FROM SERVER
-- ============================================================

RegisterNetEvent(AW.EVENT.PLAYER_SPAWNED)
AddEventHandler(AW.EVENT.PLAYER_SPAWNED, function(data)
    playerData = data
    CoreLogger.Info('client:boot', 'Player data received: %s', data.awid or '?')
end)

-- ============================================================
-- CLIENT-SIDE LOGGER (simple console)
-- ============================================================

CoreLogger = CoreLogger or {}

function CoreLogger.Info(tag, fmt, ...)
    print(string.format('[AIRWAR][%s] ' .. fmt, tag, ...))
end

function CoreLogger.Warn(tag, fmt, ...)
    print(string.format('^3[AIRWAR][%s] ' .. fmt .. '^0', tag, ...))
end

function CoreLogger.Error(tag, fmt, ...)
    print(string.format('^1[AIRWAR][%s] ' .. fmt .. '^0', tag, ...))
end

function CoreLogger.Debug(tag, fmt, ...)
    -- Client debug only in development
    if GetConvar('aw_debug', 'false') == 'true' then
        print(string.format('^5[AIRWAR:DBG][%s] ' .. fmt .. '^0', tag, ...))
    end
end

-- ============================================================
-- EXPORTS
-- ============================================================

--- Check if client is ready
---@return boolean
function IsClientReady()
    return clientReady
end

--- Get local player data
---@return table|nil
function GetLocalPlayerData()
    return playerData
end
