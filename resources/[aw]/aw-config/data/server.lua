--[[
    aw-config — Server Settings
    Global server-side configuration values.
    These tune tick rates, thresholds, gameplay parameters, etc.
]]

AWConfigData = AWConfigData or {}

AWConfigData.server = {
    -- ============================================================
    -- GENERAL
    -- ============================================================
    server_name = 'AIRWAR Server',
    max_players = 64,
    language = 'en',

    -- ============================================================
    -- TICK RATES (ms)
    -- ============================================================
    tick_rate_combat    = 50,      -- 20 Hz — combat calculations
    tick_rate_physics   = 100,     -- 10 Hz — fuel, mass, flight augmentation
    tick_rate_radar     = 250,     -- 4 Hz — radar sweeps
    tick_rate_mission   = 1000,    -- 1 Hz — mission objective checks
    tick_rate_war       = 5000,    -- 0.2 Hz — war state, zone ownership
    tick_rate_hud       = 66,      -- ~15 Hz — HUD data push
    tick_rate_economy   = 10000,   -- 0.1 Hz — economy balance checks
    tick_rate_cleanup   = 30000,   -- 30s — entity garbage collection
    tick_rate_save      = 30000,   -- 30s — write-behind flush interval

    -- ============================================================
    -- AIRCRAFT
    -- ============================================================
    max_aircraft_per_player = 1,       -- Only 1 active aircraft at a time
    max_aircraft_owned = 10,           -- Max aircraft in player hangar
    aircraft_despawn_empty_time = 30,  -- Seconds before empty aircraft despawns
    aircraft_invuln_on_spawn = 5,      -- Seconds of invulnerability after takeoff
    engine_start_time = 3,             -- Seconds to start engines

    -- ============================================================
    -- FUEL
    -- ============================================================
    fuel_consumption_idle     = 0.5,   -- Liters per second while idle
    fuel_consumption_cruise   = 2.0,   -- Liters per second at cruise
    fuel_consumption_combat   = 4.0,   -- Liters per second in combat/afterburner
    fuel_warning_threshold    = 0.20,  -- 20% fuel triggers warning
    fuel_critical_threshold   = 0.05,  -- 5% fuel triggers critical
    fuel_leak_rate            = 1.5,   -- Liters per second when fuel tank damaged

    -- ============================================================
    -- COMBAT
    -- ============================================================
    friendly_fire = false,
    kill_credit_window = 15,           -- Seconds: damage within this window counts for kill
    kill_attribution = 'highest',      -- 'highest' (most damage) or 'last' (last hit)
    weapon_ammo_infinite = false,
    max_missiles_airborne = 4,         -- Max guided missiles per player simultaneously

    -- ============================================================
    -- COUNTERMEASURES
    -- ============================================================
    cm_flare_effectiveness = 0.75,     -- 75% chance to defeat IR missile
    cm_chaff_effectiveness = 0.70,     -- 70% chance to defeat radar missile
    cm_ecm_effectiveness   = 0.50,     -- 50% chance to break radar lock
    cm_cooldown = 2.0,                 -- Seconds between CM deployments
    cm_default_count = 30,             -- Default CMs per aircraft

    -- ============================================================
    -- RADAR
    -- ============================================================
    default_radar_range = 8000,        -- Meters, default radar detection range
    rwr_range = 12000,                 -- Meters, RWR detection of radar locks
    radar_sweep_cone = 120,            -- Degrees, forward radar cone
    stealth_rcs_multiplier = 0.3,      -- Stealth aircraft RCS reduced to 30%

    -- ============================================================
    -- RESPAWN
    -- ============================================================
    respawn_time_base = 15,            -- Base respawn timer (seconds)
    respawn_time_per_death = 2,        -- Additional seconds per consecutive death
    respawn_time_max = 60,             -- Maximum respawn timer
    respawn_at_base = true,            -- Force respawn at faction base
    spectate_on_death = true,          -- Allow spectating after death

    -- ============================================================
    -- WORLD
    -- ============================================================
    zone_capture_time = 120,           -- Seconds to capture a zone
    zone_contestation_radius = 500,    -- Meters, inner radius for capture progress
    supply_regen_interval = 300,       -- Seconds between supply point regeneration
    weather_enabled = true,
    time_cycle_enabled = true,
    time_scale = 1.0,                  -- 1.0 = real time, 2.0 = double speed

    -- ============================================================
    -- MISSIONS
    -- ============================================================
    max_active_missions = 5,           -- Max simultaneous missions per faction
    mission_auto_assign = false,       -- Auto-assign missions to players
    mission_min_players = 1,           -- Minimum players to start a mission

    -- ============================================================
    -- SQUADRON
    -- ============================================================
    max_squadron_size = 6,
    squadron_comm_range = 50000,       -- Meters, squadron radio range
    squadron_xp_bonus = 0.10,          -- 10% XP bonus when in squadron

    -- ============================================================
    -- ANTI-CHEAT
    -- ============================================================
    speed_tolerance = 1.15,            -- 15% tolerance over max speed before flagged
    position_check_interval = 2000,    -- ms between server position validation
    damage_validation = true,          -- Server validates all damage claims
}
