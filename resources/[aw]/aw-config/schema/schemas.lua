--[[
    aw-config — Validation Schemas
    Defines schemas for all configurable data domains.
    Schemas are registered into CoreValidator during config load.
]]

AWConfigSchemas = AWConfigSchemas or {}

-- ============================================================
-- AIRCRAFT SCHEMA
-- ============================================================
AWConfigSchemas.aircraft = {
    type = 'table',
    fields = {
        display       = { type = 'string', required = true, min_length = 1, max_length = 64 },
        model         = { type = 'string', required = true, min_length = 1 },
        role          = { type = 'string', required = true, enum = {
            'fighter', 'bomber', 'multirole', 'interceptor', 'attacker',
            'recon', 'awacs', 'tanker', 'transport', 'gunship',
            'vtol', 'drone', 'trainer', 'stealth'
        }},
        mass          = { type = 'number', required = true, min = 100 },
        fuel_capacity = { type = 'number', required = true, min = 1 },
        max_speed     = { type = 'number', required = true, min = 1 },
        thrust        = { type = 'number', required = true, min = 0.01 },
        hardpoints    = { type = 'integer', required = true, min = 0 },
        radar_range   = { type = 'number', optional = true, min = 0 },
        rcs           = { type = 'number', optional = true, min = 0 },   -- Radar cross-section
        cm_count      = { type = 'integer', optional = true, min = 0 },  -- Countermeasures
        price         = { type = 'integer', required = true, min = 0 },
        tier          = { type = 'string', required = true, enum = { 'basic', 'advanced', 'elite', 'special' } },
        description   = { type = 'string', optional = true },
        nation        = { type = 'string', optional = true },
        crew          = { type = 'integer', optional = true, min = 1 },
        -- Flight physics
        roll_mult     = { type = 'number', optional = true },
        pitch_mult    = { type = 'number', optional = true },
        yaw_mult      = { type = 'number', optional = true },
        -- Damage zone overrides
        health_zones  = { type = 'table', optional = true },
    },
}

-- ============================================================
-- WEAPON SCHEMA
-- ============================================================
AWConfigSchemas.weapon = {
    type = 'table',
    fields = {
        display     = { type = 'string', required = true, min_length = 1 },
        type        = { type = 'string', required = true, enum = {
            'gun', 'aim_ir', 'aim_radar', 'agm', 'bomb_dumb',
            'bomb_guided', 'rocket', 'torpedo'
        }},
        damage      = { type = 'number', required = true, min = 0 },
        range       = { type = 'number', required = true, min = 0 },
        speed       = { type = 'number', optional = true, min = 0 },       -- Projectile/missile speed
        ammo        = { type = 'integer', optional = true, min = 1 },
        fire_rate   = { type = 'number', optional = true, min = 0 },       -- Rounds per second (guns)
        lock_time   = { type = 'number', optional = true, min = 0 },       -- Seconds to lock
        lock_cone   = { type = 'number', optional = true, min = 0, max = 180 }, -- Half-angle degrees
        lock_range  = { type = 'number', optional = true, min = 0 },
        splash      = { type = 'number', optional = true, min = 0 },       -- Splash damage radius
        guidance    = { type = 'string', optional = true, enum = { 'ir', 'radar', 'gps', 'laser', 'none' } },
        counterable = { type = 'string', optional = true, enum = { 'flare', 'chaff', 'ecm', 'none' } },
        weight      = { type = 'number', optional = true, min = 0 },       -- Mass per unit
        price       = { type = 'integer', optional = true, min = 0 },
        tier        = { type = 'string', optional = true, enum = { 'basic', 'advanced', 'elite', 'special' } },
        description = { type = 'string', optional = true },
    },
}

-- ============================================================
-- FACTION SCHEMA
-- ============================================================
AWConfigSchemas.faction = {
    type = 'table',
    fields = {
        display      = { type = 'string', required = true, min_length = 1 },
        color        = { type = 'string', required = true },  -- Hex color #RRGGBB
        blip_color   = { type = 'integer', optional = true },
        emblem       = { type = 'string', optional = true },
        description  = { type = 'string', optional = true },
        home_base    = { type = 'string', optional = true },  -- Reference to base ID
        aircraft     = { type = 'table', optional = true },   -- Available aircraft type IDs
        max_players  = { type = 'integer', optional = true, min = 1 },
    },
}

-- ============================================================
-- ZONE SCHEMA
-- ============================================================
AWConfigSchemas.zone = {
    type = 'table',
    fields = {
        display    = { type = 'string', required = true },
        center     = { type = 'table', required = true },     -- { x, y, z }
        radius     = { type = 'number', required = true, min = 1 },
        zone_type  = { type = 'string', required = true, enum = {
            'combat', 'restricted', 'safe', 'capture', 'supply', 'radar'
        }},
        owner      = { type = 'string', optional = true },    -- Faction ID or nil for neutral
        capture_time = { type = 'number', optional = true, min = 0 },
        points     = { type = 'integer', optional = true, min = 0 },
        blip       = { type = 'table', optional = true },
    },
}

-- ============================================================
-- BASE SCHEMA
-- ============================================================
AWConfigSchemas.base = {
    type = 'table',
    fields = {
        display      = { type = 'string', required = true },
        position     = { type = 'table', required = true },   -- { x, y, z }
        heading      = { type = 'number', required = true },
        runway       = { type = 'table', optional = true },   -- { start = {x,y,z}, end = {x,y,z} }
        spawn_points = { type = 'table', optional = true },   -- Array of { x, y, z, heading }
        owner        = { type = 'string', optional = true },  -- Faction ID
        services     = { type = 'table', optional = true },   -- { repair, rearm, refuel }
        blip         = { type = 'table', optional = true },
    },
}

-- ============================================================
-- MISSION TEMPLATE SCHEMA
-- ============================================================
AWConfigSchemas.mission = {
    type = 'table',
    fields = {
        display       = { type = 'string', required = true },
        type          = { type = 'string', required = true, enum = {
            'patrol', 'strike', 'escort', 'intercept', 'recon',
            'supply', 'capture', 'defend', 'dogfight', 'bombing'
        }},
        description   = { type = 'string', optional = true },
        min_players   = { type = 'integer', optional = true, min = 1 },
        max_players   = { type = 'integer', optional = true, min = 1 },
        time_limit    = { type = 'number', optional = true, min = 0 },    -- Seconds
        reward_credits = { type = 'integer', optional = true, min = 0 },
        reward_xp      = { type = 'integer', optional = true, min = 0 },
        objectives    = { type = 'table', optional = true },
        required_role = { type = 'string', optional = true },
        difficulty    = { type = 'string', optional = true, enum = { 'easy', 'medium', 'hard', 'extreme' } },
    },
}

-- ============================================================
-- RANK SCHEMA
-- ============================================================
AWConfigSchemas.rank = {
    type = 'table',
    fields = {
        display    = { type = 'string', required = true },
        short      = { type = 'string', optional = true },
        xp_required = { type = 'integer', required = true, min = 0 },
        tier        = { type = 'integer', required = true, min = 1 },
        unlocks     = { type = 'table', optional = true },    -- Array of permission nodes or aircraft IDs
        icon        = { type = 'string', optional = true },
    },
}

-- ============================================================
-- COUNTERMEASURE SCHEMA
-- ============================================================
AWConfigSchemas.countermeasure = {
    type = 'table',
    fields = {
        display     = { type = 'string', required = true },
        type        = { type = 'string', required = true, enum = { 'chaff', 'flare', 'ecm' } },
        effectiveness = { type = 'number', required = true, min = 0, max = 1 }, -- 0-1 chance
        defeats     = { type = 'table', required = true },   -- Array of guidance types it counters
        duration    = { type = 'number', optional = true, min = 0 },
        cooldown    = { type = 'number', optional = true, min = 0 },
    },
}
