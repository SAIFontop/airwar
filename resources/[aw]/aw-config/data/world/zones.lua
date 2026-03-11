--[[
    aw-config — World Zones
    Combat zones, safe zones, capture points over the GTA V map.
    Fields match AWConfigSchemas.zone.
    Coordinates are GTA V world coords.
]]

AWConfigData = AWConfigData or {}
AWConfigData.zone = AWConfigData.zone or {}

-- ============================================================
-- COMBAT ZONES (active warfare areas)
-- ============================================================

AWConfigData.zone['cz_vinewood'] = {
    display     = 'Vinewood Airspace',
    center      = { x = 300.0, y = 300.0, z = 500.0 },
    radius      = 3000,
    zone_type   = 'combat',
    owner       = nil,
    points      = 10,
    blip        = { sprite = 567, color = 1, alpha = 80 },
}

AWConfigData.zone['cz_ocean'] = {
    display     = 'Pacific Theater',
    center      = { x = -3500.0, y = -1000.0, z = 300.0 },
    radius      = 5000,
    zone_type   = 'combat',
    owner       = nil,
    points      = 15,
    blip        = { sprite = 567, color = 1, alpha = 80 },
}

AWConfigData.zone['cz_desert'] = {
    display     = 'Grand Senora Desert',
    center      = { x = 2500.0, y = 3000.0, z = 400.0 },
    radius      = 4000,
    zone_type   = 'combat',
    owner       = nil,
    points      = 12,
    blip        = { sprite = 567, color = 1, alpha = 80 },
}

AWConfigData.zone['cz_mountain'] = {
    display     = 'Mount Chiliad Theater',
    center      = { x = 500.0, y = 5500.0, z = 800.0 },
    radius      = 3500,
    zone_type   = 'combat',
    owner       = nil,
    points      = 12,
    blip        = { sprite = 567, color = 1, alpha = 80 },
}

AWConfigData.zone['cz_alamo'] = {
    display     = 'Alamo Sea Corridor',
    center      = { x = 1500.0, y = 4000.0, z = 400.0 },
    radius      = 2500,
    zone_type   = 'combat',
    owner       = nil,
    points      = 8,
    blip        = { sprite = 567, color = 1, alpha = 80 },
}

-- ============================================================
-- CAPTURE ZONES (contestable points)
-- ============================================================

AWConfigData.zone['cap_oilrig'] = {
    display     = 'Oil Rig Alpha',
    center      = { x = -3600.0, y = 2200.0, z = 200.0 },
    radius      = 1000,
    zone_type   = 'capture',
    owner       = nil,
    capture_time = 120,
    points      = 25,
    blip        = { sprite = 378, color = 5, alpha = 128 },
}

AWConfigData.zone['cap_humane'] = {
    display     = 'Humane Labs Airfield',
    center      = { x = 3600.0, y = 3700.0, z = 200.0 },
    radius      = 800,
    zone_type   = 'capture',
    owner       = nil,
    capture_time = 90,
    points      = 20,
    blip        = { sprite = 378, color = 5, alpha = 128 },
}

AWConfigData.zone['cap_prison'] = {
    display     = 'Bolingbroke Compound',
    center      = { x = 1680.0, y = 2530.0, z = 200.0 },
    radius      = 600,
    zone_type   = 'capture',
    owner       = nil,
    capture_time = 60,
    points      = 15,
    blip        = { sprite = 378, color = 5, alpha = 128 },
}

AWConfigData.zone['cap_port'] = {
    display     = 'Terminal Docks',
    center      = { x = 1200.0, y = -3000.0, z = 200.0 },
    radius      = 1200,
    zone_type   = 'capture',
    owner       = nil,
    capture_time = 120,
    points      = 20,
    blip        = { sprite = 378, color = 5, alpha = 128 },
}

AWConfigData.zone['cap_satellite'] = {
    display     = 'Satellite Array',
    center      = { x = -400.0, y = 3500.0, z = 600.0 },
    radius      = 500,
    zone_type   = 'capture',
    owner       = nil,
    capture_time = 90,
    points      = 30,
    blip        = { sprite = 378, color = 5, alpha = 128 },
}

-- ============================================================
-- SAFE ZONES (no combat)
-- ============================================================

AWConfigData.zone['safe_lsia'] = {
    display     = 'LSIA Safe Zone',
    center      = { x = -1070.0, y = -2970.0, z = 200.0 },
    radius      = 1500,
    zone_type   = 'safe',
    owner       = 'eagles',
    blip        = { sprite = 423, color = 2, alpha = 100 },
}

AWConfigData.zone['safe_zancudo'] = {
    display     = 'Fort Zancudo Safe Zone',
    center      = { x = -2450.0, y = 3200.0, z = 200.0 },
    radius      = 1500,
    zone_type   = 'safe',
    owner       = 'wolves',
    blip        = { sprite = 423, color = 2, alpha = 100 },
}

AWConfigData.zone['safe_sandy'] = {
    display     = 'Sandy Shores Safe Zone',
    center      = { x = 1700.0, y = 3200.0, z = 200.0 },
    radius      = 1000,
    zone_type   = 'safe',
    owner       = 'dragons',
    blip        = { sprite = 423, color = 2, alpha = 100 },
}

-- ============================================================
-- SUPPLY ZONES
-- ============================================================

AWConfigData.zone['supply_grapeseed'] = {
    display     = 'Grapeseed Supply Depot',
    center      = { x = 1750.0, y = 4800.0, z = 200.0 },
    radius      = 500,
    zone_type   = 'supply',
    owner       = nil,
    blip        = { sprite = 478, color = 25, alpha = 128 },
}

AWConfigData.zone['supply_chumash'] = {
    display     = 'Chumash Supply Cache',
    center      = { x = -3200.0, y = 400.0, z = 200.0 },
    radius      = 500,
    zone_type   = 'supply',
    owner       = nil,
    blip        = { sprite = 478, color = 25, alpha = 128 },
}

AWConfigData.zone['supply_paleto'] = {
    display     = 'Paleto Bay Depot',
    center      = { x = -200.0, y = 6400.0, z = 200.0 },
    radius      = 600,
    zone_type   = 'supply',
    owner       = nil,
    blip        = { sprite = 478, color = 25, alpha = 128 },
}

-- ============================================================
-- RADAR COVERAGE ZONES
-- ============================================================

AWConfigData.zone['radar_chiliad'] = {
    display     = 'Chiliad RADAR Station',
    center      = { x = 500.0, y = 5600.0, z = 800.0 },
    radius      = 15000,
    zone_type   = 'radar',
    owner       = nil,
    blip        = { sprite = 604, color = 66, alpha = 40 },
}

AWConfigData.zone['radar_josiah'] = {
    display     = 'Mount Josiah RADAR',
    center      = { x = -1050.0, y = 4700.0, z = 700.0 },
    radius      = 12000,
    zone_type   = 'radar',
    owner       = nil,
    blip        = { sprite = 604, color = 66, alpha = 40 },
}

-- ============================================================
-- RESTRICTED ZONES (instant warning/kill if unauthorized)
-- ============================================================

AWConfigData.zone['restricted_city_core'] = {
    display     = 'Downtown LS Restricted',
    center      = { x = -250.0, y = -800.0, z = 200.0 },
    radius      = 2000,
    zone_type   = 'restricted',
    owner       = nil,
    blip        = { sprite = 310, color = 49, alpha = 60 },
}
