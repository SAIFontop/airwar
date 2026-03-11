--[[
    aw-config — Aircraft Data: Support
    AWACS, tankers, recon, electronic warfare, drones.
    Data derived from FiveM-Plane-Pack handling.meta.
]]

AWConfigData = AWConfigData or {}
AWConfigData.aircraft = AWConfigData.aircraft or {}

-- ============================================================
-- AWACS / AIRBORNE EARLY WARNING
-- ============================================================

AWConfigData.aircraft['erieye'] = {
    display     = 'Saab 340 AEW&C',
    model       = 'erieye',
    role        = 'awacs',
    mass        = 15000,
    fuel_capacity = 5500,
    max_speed   = 220.0,
    thrust      = 1.62,
    hardpoints  = 0,
    radar_range = 45000,
    rcs         = 12.0,
    cm_count    = 24,
    price       = 70000,
    tier        = 'elite',
    description = 'Airborne early warning with Erieye radar — extends team radar range',
    nation      = 'SWE',
    crew        = 6,
    roll_mult   = 0.0030,
    pitch_mult  = 0.00024,
    yaw_mult    = -0.000070,
}

AWConfigData.aircraft['kj2000'] = {
    display     = 'KJ-2000 AWACS',
    model       = 'kj2000',
    role        = 'awacs',
    mass        = 38000,
    fuel_capacity = 20000,
    max_speed   = 230.0,
    thrust      = 0.62,
    hardpoints  = 0,
    radar_range = 50000,
    rcs         = 25.0,
    cm_count    = 30,
    price       = 90000,
    tier        = 'special',
    description = 'Chinese AWACS with 360-degree phased array radar',
    nation      = 'CHN',
    crew        = 15,
    roll_mult   = 0.0020,
    pitch_mult  = 0.00016,
    yaw_mult    = -0.000050,
}

-- ============================================================
-- TANKERS / REFUELING
-- ============================================================

AWConfigData.aircraft['kc10'] = {
    display     = 'KC-10 Extender',
    model       = 'kc10',
    role        = 'tanker',
    mass        = 110000,
    fuel_capacity = 160000,
    max_speed   = 260.0,
    thrust      = 0.62,
    hardpoints  = 0,
    radar_range = 6000,
    rcs         = 30.0,
    cm_count    = 16,
    price       = 55000,
    tier        = 'advanced',
    description = 'Aerial refueling tanker — can refuel friendly aircraft in-flight',
    nation      = 'USA',
    crew        = 4,
    roll_mult   = 0.0016,
    pitch_mult  = 0.00014,
    yaw_mult    = -0.000040,
}

AWConfigData.aircraft['dc10'] = {
    display     = 'DC-10 Tanker',
    model       = 'dc10',
    role        = 'tanker',
    mass        = 100000,
    fuel_capacity = 140000,
    max_speed   = 250.0,
    thrust      = 0.60,
    hardpoints  = 0,
    radar_range = 5000,
    rcs         = 30.0,
    cm_count    = 10,
    price       = 40000,
    tier        = 'advanced',
    description = 'Converted airliner used as aerial tanker',
    nation      = 'USA',
    crew        = 3,
    roll_mult   = 0.0016,
    pitch_mult  = 0.00014,
    yaw_mult    = -0.000040,
}

AWConfigData.aircraft['dc10f'] = {
    display     = 'DC-10F Freighter',
    model       = 'dc10f',
    role        = 'tanker',
    mass        = 100000,
    fuel_capacity = 130000,
    max_speed   = 250.0,
    thrust      = 0.60,
    hardpoints  = 0,
    radar_range = 5000,
    rcs         = 30.0,
    cm_count    = 10,
    price       = 38000,
    tier        = 'advanced',
    description = 'DC-10 freighter variant adapted for tanker role',
    nation      = 'USA',
    crew        = 3,
    roll_mult   = 0.0016,
    pitch_mult  = 0.00014,
    yaw_mult    = -0.000040,
}

-- ============================================================
-- RECONNAISSANCE / RECON
-- ============================================================

AWConfigData.aircraft['u2r'] = {
    display     = 'U-2R Dragon Lady',
    model       = 'u2r',
    role        = 'recon',
    mass        = 18000,
    fuel_capacity = 7000,
    max_speed   = 220.0,
    thrust      = 0.5,
    hardpoints  = 0,
    radar_range = 30000,
    rcs         = 1.5,
    cm_count    = 10,
    price       = 45000,
    tier        = 'advanced',
    description = 'Ultra-high altitude strategic reconnaissance aircraft',
    nation      = 'USA',
    crew        = 1,
    roll_mult   = 0.0030,
    pitch_mult  = 0.00025,
    yaw_mult    = -0.000070,
}

AWConfigData.aircraft['u2s'] = {
    display     = 'U-2S Dragon Lady',
    model       = 'u2s',
    role        = 'recon',
    mass        = 18000,
    fuel_capacity = 7200,
    max_speed   = 225.0,
    thrust      = 0.55,
    hardpoints  = 0,
    radar_range = 32000,
    rcs         = 1.4,
    cm_count    = 12,
    price       = 48000,
    tier        = 'advanced',
    description = 'Upgraded U-2 with modern sensors and engine',
    nation      = 'USA',
    crew        = 1,
    roll_mult   = 0.0030,
    pitch_mult  = 0.00025,
    yaw_mult    = -0.000070,
}

-- ============================================================
-- DRONES / UNMANNED
-- ============================================================

AWConfigData.aircraft['mq9'] = {
    display     = 'MQ-9 Reaper',
    model       = 'mq9',
    role        = 'drone',
    mass        = 15000,
    fuel_capacity = 2700,
    max_speed   = 165.0,
    thrust      = 0.87,
    hardpoints  = 4,
    radar_range = 15000,
    rcs         = 1.0,
    cm_count    = 8,
    price       = 35000,
    tier        = 'advanced',
    description = 'Armed UCAV — remotely operated, long endurance',
    nation      = 'USA',
    crew        = 0,
    roll_mult   = 0.0040,
    pitch_mult  = 0.00036,
    yaw_mult    = -0.000090,
}

AWConfigData.aircraft['pmq1'] = {
    display     = 'MQ-1 Predator',
    model       = 'pmq1',
    role        = 'drone',
    mass        = 5000,
    fuel_capacity = 900,
    max_speed   = 120.0,
    thrust      = 0.4,
    hardpoints  = 2,
    radar_range = 10000,
    rcs         = 0.8,
    cm_count    = 4,
    price       = 18000,
    tier        = 'basic',
    description = 'Original Predator UAV for recon and light strike',
    nation      = 'USA',
    crew        = 0,
    roll_mult   = 0.0038,
    pitch_mult  = 0.00034,
    yaw_mult    = -0.000085,
}

AWConfigData.aircraft['dm3'] = {
    display     = 'RQ-4 Global Hawk (Scout)',
    model       = 'dm3',
    role        = 'drone',
    mass        = 10000,
    fuel_capacity = 6800,
    max_speed   = 180.0,
    thrust      = 0.6,
    hardpoints  = 0,
    radar_range = 35000,
    rcs         = 1.5,
    cm_count    = 6,
    price       = 42000,
    tier        = 'advanced',
    description = 'High-altitude long-endurance surveillance drone',
    nation      = 'USA',
    crew        = 0,
    roll_mult   = 0.0035,
    pitch_mult  = 0.00030,
    yaw_mult    = -0.000080,
}

AWConfigData.aircraft['dm5'] = {
    display     = 'Drone Mk.5 Combat',
    model       = 'dm5',
    role        = 'drone',
    mass        = 8000,
    fuel_capacity = 3000,
    max_speed   = 200.0,
    thrust      = 1.0,
    hardpoints  = 4,
    radar_range = 12000,
    rcs         = 0.6,
    cm_count    = 10,
    price       = 38000,
    tier        = 'advanced',
    description = 'Next-gen combat drone with AI-assisted targeting',
    nation      = 'USA',
    crew        = 0,
    roll_mult   = 0.0046,
    pitch_mult  = 0.00042,
    yaw_mult    = -0.000095,
}

AWConfigData.aircraft['dmnb'] = {
    display     = 'Drone NightBird',
    model       = 'dmnb',
    role        = 'drone',
    mass        = 6000,
    fuel_capacity = 2200,
    max_speed   = 190.0,
    thrust      = 0.8,
    hardpoints  = 2,
    radar_range = 14000,
    rcs         = 0.4,
    cm_count    = 8,
    price       = 32000,
    tier        = 'advanced',
    description = 'Stealth recon drone with night-vision optics',
    nation      = 'USA',
    crew        = 0,
    roll_mult   = 0.0044,
    pitch_mult  = 0.00040,
    yaw_mult    = -0.000090,
}

AWConfigData.aircraft['draf'] = {
    display     = 'Drone Rafale',
    model       = 'draf',
    role        = 'drone',
    mass        = 7000,
    fuel_capacity = 2500,
    max_speed   = 250.0,
    thrust      = 1.5,
    hardpoints  = 4,
    radar_range = 10000,
    rcs         = 0.5,
    cm_count    = 12,
    price       = 40000,
    tier        = 'advanced',
    description = 'French-designed autonomous combat drone',
    nation      = 'FRA',
    crew        = 0,
    roll_mult   = 0.0046,
    pitch_mult  = 0.00042,
    yaw_mult    = -0.000095,
}
