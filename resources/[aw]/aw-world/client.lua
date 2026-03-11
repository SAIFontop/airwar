--[[
    aw-world — Client-side World Sync
    
    Responsibilities:
    1. Receive world state sync from server
    2. Apply weather changes
    3. Apply time sync
    4. Render zone boundaries (blips, markers)
    5. Render base markers
]]

-- ============================================================
-- CLIENT STATE
-- ============================================================

local worldState = {
    zones   = {},
    bases   = {},
    weather = { current = 'CLEAR', wind = { speed = 5, direction = 180 }, time = { hour = 12, minute = 0 } },
}

local blips = {}
local weatherTransitioning = false

-- ============================================================
-- WEATHER APPLICATION
-- ============================================================

--- Apply weather to client
---@param weatherType string
---@param transition boolean
local function applyWeather(weatherType, transition)
    if transition then
        weatherTransitioning = true
        SetWeatherTypeOvertimePersist(weatherType, 30.0)
        SetTimeout(30000, function()
            weatherTransitioning = false
        end)
    else
        SetWeatherTypePersist(weatherType)
        SetWeatherTypeNow(weatherType)
    end
end

--- Apply time to client
---@param hour number
---@param minute number
local function applyTime(hour, minute)
    NetworkOverrideClockTime(hour, minute, 0)
end

--- Apply wind
---@param speed number
---@param direction number
local function applyWind(speed, direction)
    local rad = math.rad(direction)
    local x = math.sin(rad) * speed
    local y = math.cos(rad) * speed
    SetWind(speed)
    SetWindDirection(x, y, 0.0)
end

-- ============================================================
-- ZONE BLIPS
-- ============================================================

--- Faction color to blip color
local FACTION_BLIP_COLORS = {
    usaf    = 3,  -- Blue
    redfor  = 1,  -- Red
    nato    = 25, -- Green
    pmc     = 5,  -- Yellow
}

--- Create blips for all zones
local function createZoneBlips()
    -- Remove old blips
    for _, blip in ipairs(blips) do
        if DoesBlipExist(blip) then
            RemoveBlip(blip)
        end
    end
    blips = {}

    for zoneId, zone in pairs(worldState.zones) do
        if zone.center then
            local blip = AddBlipForRadius(zone.center.x or zone.center[1], zone.center.y or zone.center[2], zone.center.z or zone.center[3] or 0.0, zone.radius or 1000.0)
            SetBlipAlpha(blip, 80)

            local color = 0 -- White for neutral
            if zone.owner and FACTION_BLIP_COLORS[zone.owner] then
                color = FACTION_BLIP_COLORS[zone.owner]
            end
            SetBlipColour(blip, color)

            blips[#blips + 1] = blip

            -- Center marker blip
            local centerBlip = AddBlipForCoord(zone.center.x or zone.center[1], zone.center.y or zone.center[2], zone.center.z or zone.center[3] or 0.0)
            SetBlipSprite(centerBlip, 543) -- Parachute / military
            SetBlipScale(centerBlip, 0.8)
            SetBlipColour(centerBlip, color)
            SetBlipAsShortRange(centerBlip, true)
            BeginTextCommandSetBlipName('STRING')
            AddTextComponentSubstringPlayerName(zone.display or zoneId)
            EndTextCommandSetBlipName(centerBlip)

            blips[#blips + 1] = centerBlip
        end
    end
end

--- Create blips for all bases
local function createBaseBlips()
    for baseId, base in pairs(worldState.bases) do
        if base.position then
            local blip = AddBlipForCoord(base.position.x or base.position[1], base.position.y or base.position[2], base.position.z or base.position[3] or 0.0)
            SetBlipSprite(blip, 569) -- Hangar icon
            SetBlipScale(blip, 1.0)

            local color = 0
            if base.faction and FACTION_BLIP_COLORS[base.faction] then
                color = FACTION_BLIP_COLORS[base.faction]
            end
            SetBlipColour(blip, color)

            if not base.intact then
                SetBlipAlpha(blip, 100) -- Dimmed if destroyed
            end

            BeginTextCommandSetBlipName('STRING')
            AddTextComponentSubstringPlayerName(('[%s] %s'):format(base.intact and 'Base' or 'Destroyed', base.display or baseId))
            EndTextCommandSetBlipName(blip)

            blips[#blips + 1] = blip
        end
    end
end

-- ============================================================
-- EVENT HANDLERS
-- ============================================================

--- Full state sync from server
RegisterNetEvent('aw:world:state_sync')
AddEventHandler('aw:world:state_sync', function(data)
    if not data then return end

    worldState.zones = data.zones or {}
    worldState.bases = data.bases or {}
    worldState.weather = data.weather or worldState.weather

    -- Apply weather and time
    applyWeather(worldState.weather.current, false)
    applyTime(worldState.weather.time.hour, worldState.weather.time.minute)
    if worldState.weather.wind then
        applyWind(worldState.weather.wind.speed, worldState.weather.wind.direction)
    end

    -- Create map blips
    createZoneBlips()
    createBaseBlips()
end)

--- Weather sync
RegisterNetEvent('aw:world:weather_sync')
AddEventHandler('aw:world:weather_sync', function(data)
    if not data then return end

    worldState.weather = data
    applyWeather(data.current, true)
    if data.wind then
        applyWind(data.wind.speed, data.wind.direction)
    end
end)

--- Zone captured — update local state and blips
RegisterNetEvent(AW.EVENT.ZONE_CAPTURED)
AddEventHandler(AW.EVENT.ZONE_CAPTURED, function(data)
    if not data or not data.zone_id then return end

    if worldState.zones[data.zone_id] then
        worldState.zones[data.zone_id].owner = data.faction
    end

    -- Rebuild blips
    createZoneBlips()
    createBaseBlips()
end)

-- ============================================================
-- TIME SYNC LOOP
-- ============================================================

CreateThread(function()
    while true do
        Wait(2000)
        -- Keep network time synced
        if worldState.weather and worldState.weather.time then
            applyTime(worldState.weather.time.hour, worldState.weather.time.minute)
            -- Increment local time estimate
            worldState.weather.time.minute = worldState.weather.time.minute + 1
            if worldState.weather.time.minute >= 60 then
                worldState.weather.time.minute = 0
                worldState.weather.time.hour = (worldState.weather.time.hour + 1) % 24
            end
        end
    end
end)

-- ============================================================
-- CLEANUP
-- ============================================================

AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end

    for _, blip in ipairs(blips) do
        if DoesBlipExist(blip) then
            RemoveBlip(blip)
        end
    end
    blips = {}
end)
