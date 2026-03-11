--[[
    aw-config — Air Bases
    Military and civilian airfields with runways, spawn points, services.
    Fields match AWConfigSchemas.base.
    Coordinates are GTA V world coords.
]]

AWConfigData = AWConfigData or {}
AWConfigData.base = AWConfigData.base or {}

-- ============================================================
-- MAIN FACTION BASES
-- ============================================================

AWConfigData.base['base_lsia'] = {
    display      = 'Los Santos International',
    position     = { x = -1070.0, y = -2970.0, z = 13.9 },
    heading      = 300.0,
    runway       = {
        start = { x = -1550.0, y = -2920.0, z = 13.9 },
        ['end'] = { x = -780.0, y = -3440.0, z = 13.9 },
    },
    spawn_points = {
        { x = -1290.0, y = -3350.0, z = 13.9, heading = 300.0 },
        { x = -1250.0, y = -3300.0, z = 13.9, heading = 300.0 },
        { x = -1210.0, y = -3250.0, z = 13.9, heading = 300.0 },
        { x = -1170.0, y = -3200.0, z = 13.9, heading = 300.0 },
        { x = -1130.0, y = -3150.0, z = 13.9, heading = 300.0 },
        { x = -1090.0, y = -3100.0, z = 13.9, heading = 300.0 },
    },
    owner        = 'eagles',
    services     = { repair = true, rearm = true, refuel = true },
    blip         = { sprite = 307, color = 3, scale = 1.2 },
}

AWConfigData.base['base_zancudo'] = {
    display      = 'Fort Zancudo Air Force Base',
    position     = { x = -2450.0, y = 3200.0, z = 32.8 },
    heading      = 150.0,
    runway       = {
        start = { x = -2200.0, y = 3340.0, z = 32.8 },
        ['end'] = { x = -2680.0, y = 3070.0, z = 32.8 },
    },
    spawn_points = {
        { x = -2150.0, y = 3170.0, z = 32.8, heading = 150.0 },
        { x = -2180.0, y = 3200.0, z = 32.8, heading = 150.0 },
        { x = -2210.0, y = 3230.0, z = 32.8, heading = 150.0 },
        { x = -2240.0, y = 3260.0, z = 32.8, heading = 150.0 },
        { x = -2270.0, y = 3290.0, z = 32.8, heading = 150.0 },
        { x = -2300.0, y = 3320.0, z = 32.8, heading = 150.0 },
    },
    owner        = 'wolves',
    services     = { repair = true, rearm = true, refuel = true },
    blip         = { sprite = 307, color = 1, scale = 1.2 },
}

AWConfigData.base['base_sandy'] = {
    display      = 'Sandy Shores Airfield',
    position     = { x = 1700.0, y = 3200.0, z = 40.2 },
    heading      = 135.0,
    runway       = {
        start = { x = 1540.0, y = 3260.0, z = 40.2 },
        ['end'] = { x = 1870.0, y = 3140.0, z = 40.2 },
    },
    spawn_points = {
        { x = 1640.0, y = 3230.0, z = 40.2, heading = 135.0 },
        { x = 1665.0, y = 3210.0, z = 40.2, heading = 135.0 },
        { x = 1690.0, y = 3190.0, z = 40.2, heading = 135.0 },
        { x = 1715.0, y = 3170.0, z = 40.2, heading = 135.0 },
    },
    owner        = 'dragons',
    services     = { repair = true, rearm = true, refuel = true },
    blip         = { sprite = 307, color = 46, scale = 1.2 },
}

-- ============================================================
-- SECONDARY / FORWARD BASES
-- ============================================================

AWConfigData.base['base_grapeseed'] = {
    display      = 'Grapeseed Airstrip',
    position     = { x = 2125.0, y = 4800.0, z = 40.6 },
    heading      = 285.0,
    runway       = {
        start = { x = 2003.0, y = 4835.0, z = 40.6 },
        ['end'] = { x = 2287.0, y = 4757.0, z = 40.6 },
    },
    spawn_points = {
        { x = 2040.0, y = 4820.0, z = 40.6, heading = 285.0 },
        { x = 2075.0, y = 4810.0, z = 40.6, heading = 285.0 },
        { x = 2110.0, y = 4800.0, z = 40.6, heading = 285.0 },
    },
    owner        = nil, -- Neutral, capturable
    services     = { repair = false, rearm = true, refuel = true },
    blip         = { sprite = 307, color = 4, scale = 0.9 },
}

AWConfigData.base['base_mckenzie'] = {
    display      = 'McKenzie Field',
    position     = { x = 2130.0, y = 4790.0, z = 40.5 },
    heading      = 260.0,
    runway       = {
        start = { x = 2025.0, y = 4750.0, z = 40.5 },
        ['end'] = { x = 2230.0, y = 4820.0, z = 40.5 },
    },
    spawn_points = {
        { x = 2080.0, y = 4760.0, z = 40.5, heading = 260.0 },
        { x = 2120.0, y = 4770.0, z = 40.5, heading = 260.0 },
    },
    owner        = nil,
    services     = { repair = false, rearm = false, refuel = true },
    blip         = { sprite = 307, color = 4, scale = 0.8 },
}

AWConfigData.base['base_cayo'] = {
    display      = 'Cayo Perico Forward Base',
    position     = { x = 4524.0, y = -4611.0, z = 4.0 },
    heading      = 315.0,
    runway       = {
        start = { x = 4445.0, y = -4560.0, z = 4.0 },
        ['end'] = { x = 4600.0, y = -4660.0, z = 4.0 },
    },
    spawn_points = {
        { x = 4470.0, y = -4570.0, z = 4.0, heading = 315.0 },
        { x = 4500.0, y = -4590.0, z = 4.0, heading = 315.0 },
        { x = 4530.0, y = -4610.0, z = 4.0, heading = 315.0 },
    },
    owner        = nil,
    services     = { repair = true, rearm = true, refuel = true },
    blip         = { sprite = 307, color = 4, scale = 1.0 },
}

-- ============================================================
-- CARRIER (Mobile sea-based)
-- ============================================================

AWConfigData.base['base_carrier'] = {
    display      = 'USS Valor (Aircraft Carrier)',
    position     = { x = -3200.0, y = -600.0, z = 6.0 },
    heading      = 45.0,
    runway       = {
        start = { x = -3250.0, y = -650.0, z = 8.0 },
        ['end'] = { x = -3150.0, y = -550.0, z = 8.0 },
    },
    spawn_points = {
        { x = -3230.0, y = -630.0, z = 8.0, heading = 45.0 },
        { x = -3210.0, y = -610.0, z = 8.0, heading = 45.0 },
        { x = -3190.0, y = -590.0, z = 8.0, heading = 45.0 },
        { x = -3240.0, y = -620.0, z = 8.0, heading = 225.0 }, -- Catapult 2
    },
    owner        = nil,
    services     = { repair = true, rearm = true, refuel = true },
    blip         = { sprite = 455, color = 3, scale = 1.3 },
}
