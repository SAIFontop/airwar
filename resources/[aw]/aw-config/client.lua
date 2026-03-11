--[[
    aw-config — Client-Side Config Receiver
    Receives frozen config data from server for client-side lookups.
    Client only gets data it needs (aircraft display info, faction colors, UI settings).
]]

local ClientConfig = {}
ClientConfig.__index = ClientConfig

local configData = {}
local ready = false

-- ============================================================
-- RECEIVE CONFIG FROM SERVER
-- ============================================================
RegisterNetEvent('aw:config:sync', function(data)
    if not data then return end
    configData = data
    ready = true

    if ClientEvents then
        ClientEvents.Emit('Config.Ready', data)
    end
end)

-- ============================================================
-- PUBLIC API
-- ============================================================

--- Check if config is ready
---@return boolean
function ClientConfig.IsReady()
    return ready
end

--- Get all entries for a domain (client-side subset)
---@param domain string e.g. 'aircraft', 'faction'
---@return table
function ClientConfig.GetAll(domain)
    return configData[domain] or {}
end

--- Get a single entry from a domain
---@param domain string
---@param typeId string
---@return table|nil
function ClientConfig.Get(domain, typeId)
    local dom = configData[domain]
    return dom and dom[typeId] or nil
end

--- Get a config value by dot-path
---@param path string e.g. 'ui.hud_refresh_rate'
---@return any
function ClientConfig.GetValue(path)
    local parts = {}
    for part in path:gmatch('[^%.]+') do
        parts[#parts + 1] = part
    end

    local current = configData
    for _, part in ipairs(parts) do
        if type(current) == 'table' then
            current = current[part]
        else
            return nil
        end
    end
    return current
end

--- Get faction display color
---@param factionId string
---@return string|nil hex color
function ClientConfig.GetFactionColor(factionId)
    local faction = ClientConfig.Get('faction', factionId)
    return faction and faction.color or nil
end

--- Get aircraft display info
---@param typeId string
---@return table|nil { display, model, role, tier }
function ClientConfig.GetAircraftInfo(typeId)
    local ac = ClientConfig.Get('aircraft', typeId)
    if not ac then return nil end
    return {
        display = ac.display,
        model = ac.model,
        role = ac.role,
        tier = ac.tier,
    }
end

-- Wait for config then request sync
CreateThread(function()
    while not NetworkIsSessionStarted() do Wait(100) end
    TriggerServerEvent('aw:config:requestSync')
end)

AWClientConfig = ClientConfig
