--[[
    aw-config — Mission Templates
    Pre-defined mission types with objectives, rewards, requirements.
    Fields match AWConfigSchemas.mission.
]]

AWConfigData = AWConfigData or {}
AWConfigData.mission = AWConfigData.mission or {}

-- ============================================================
-- PATROL MISSIONS
-- ============================================================

AWConfigData.mission['patrol_routine'] = {
    display        = 'Routine Patrol',
    type           = 'patrol',
    description    = 'Fly through waypoints in controlled airspace. Engage hostiles on sight.',
    min_players    = 1,
    max_players    = 4,
    time_limit     = 600,
    reward_credits = 500,
    reward_xp      = 200,
    objectives     = {
        { type = 'waypoint', count = 5, description = 'Visit all patrol waypoints' },
    },
    required_role  = nil,
    difficulty     = 'easy',
}

AWConfigData.mission['patrol_border'] = {
    display        = 'Border Patrol',
    type           = 'patrol',
    description    = 'Patrol the faction border. Report and engage any incursions.',
    min_players    = 2,
    max_players    = 6,
    time_limit     = 900,
    reward_credits = 800,
    reward_xp      = 350,
    objectives     = {
        { type = 'waypoint', count = 8, description = 'Complete border circuit' },
        { type = 'time_in_zone', duration = 300, description = 'Maintain presence 5 min' },
    },
    required_role  = nil,
    difficulty     = 'medium',
}

-- ============================================================
-- STRIKE MISSIONS
-- ============================================================

AWConfigData.mission['strike_ground'] = {
    display        = 'Ground Strike',
    type           = 'strike',
    description    = 'Destroy designated ground targets. Heavy AA expected.',
    min_players    = 2,
    max_players    = 6,
    time_limit     = 900,
    reward_credits = 1500,
    reward_xp      = 600,
    objectives     = {
        { type = 'destroy', target_type = 'ground', count = 4, description = 'Destroy ground targets' },
    },
    required_role  = 'bomber',
    difficulty     = 'medium',
}

AWConfigData.mission['strike_base'] = {
    display        = 'Base Strike',
    type           = 'strike',
    description    = 'Attack enemy base infrastructure. Expect heavy resistance.',
    min_players    = 4,
    max_players    = 8,
    time_limit     = 1200,
    reward_credits = 3000,
    reward_xp      = 1200,
    objectives     = {
        { type = 'destroy', target_type = 'structure', count = 3, description = 'Destroy base structures' },
        { type = 'survive', description = 'At least 2 pilots must survive' },
    },
    required_role  = nil,
    difficulty     = 'hard',
}

-- ============================================================
-- ESCORT MISSIONS
-- ============================================================

AWConfigData.mission['escort_transport'] = {
    display        = 'Transport Escort',
    type           = 'escort',
    description    = 'Protect a transport aircraft from point A to B.',
    min_players    = 2,
    max_players    = 6,
    time_limit     = 900,
    reward_credits = 1200,
    reward_xp      = 500,
    objectives     = {
        { type = 'escort', target_type = 'transport', description = 'Escort arrives safely' },
    },
    required_role  = 'fighter',
    difficulty     = 'medium',
}

AWConfigData.mission['escort_tanker'] = {
    display        = 'Tanker Escort',
    type           = 'escort',
    description    = 'Escort the KC-10 tanker through contested airspace.',
    min_players    = 3,
    max_players    = 6,
    time_limit     = 1200,
    reward_credits = 1500,
    reward_xp      = 600,
    objectives     = {
        { type = 'escort', target_type = 'tanker', description = 'Tanker reaches destination' },
        { type = 'kill', count = 0, description = 'Eliminate interceptors (dynamic)' },
    },
    required_role  = nil,
    difficulty     = 'hard',
}

-- ============================================================
-- INTERCEPT MISSIONS
-- ============================================================

AWConfigData.mission['intercept_bomber'] = {
    display        = 'Bomber Intercept',
    type           = 'intercept',
    description    = 'Enemy bombers inbound. Scramble and destroy before they reach target.',
    min_players    = 1,
    max_players    = 4,
    time_limit     = 600,
    reward_credits = 1000,
    reward_xp      = 450,
    objectives     = {
        { type = 'kill', target_type = 'bomber', count = 3, description = 'Shoot down enemy bombers' },
    },
    required_role  = 'interceptor',
    difficulty     = 'medium',
}

AWConfigData.mission['intercept_recon'] = {
    display        = 'Recon Intercept',
    type           = 'intercept',
    description    = 'Enemy reconnaissance aircraft detected. Destroy before intel is gathered.',
    min_players    = 1,
    max_players    = 2,
    time_limit     = 480,
    reward_credits = 800,
    reward_xp      = 300,
    objectives     = {
        { type = 'kill', target_type = 'recon', count = 1, description = 'Destroy recon aircraft' },
    },
    required_role  = nil,
    difficulty     = 'easy',
}

-- ============================================================
-- RECON MISSIONS
-- ============================================================

AWConfigData.mission['recon_photo'] = {
    display        = 'Photo Recon',
    type           = 'recon',
    description    = 'Fly over enemy territory and gather intelligence at marked locations.',
    min_players    = 1,
    max_players    = 2,
    time_limit     = 720,
    reward_credits = 700,
    reward_xp      = 400,
    objectives     = {
        { type = 'waypoint', count = 6, description = 'Photograph all recon points' },
        { type = 'no_detect', description = 'Avoid radar detection (bonus)' },
    },
    required_role  = 'recon',
    difficulty     = 'medium',
}

-- ============================================================
-- SUPPLY MISSIONS
-- ============================================================

AWConfigData.mission['supply_run'] = {
    display        = 'Supply Run',
    type           = 'supply',
    description    = 'Deliver supplies from main base to forward operating base.',
    min_players    = 1,
    max_players    = 4,
    time_limit     = 900,
    reward_credits = 600,
    reward_xp      = 250,
    objectives     = {
        { type = 'deliver', destination = 'forward_base', description = 'Deliver supplies' },
    },
    required_role  = 'transport',
    difficulty     = 'easy',
}

-- ============================================================
-- CAPTURE MISSIONS
-- ============================================================

AWConfigData.mission['capture_zone'] = {
    display        = 'Zone Capture',
    type           = 'capture',
    description    = 'Establish air superiority over a contested zone to capture it.',
    min_players    = 3,
    max_players    = 8,
    time_limit     = 1200,
    reward_credits = 2000,
    reward_xp      = 800,
    objectives     = {
        { type = 'capture', description = 'Hold zone for required duration' },
        { type = 'defend_timer', duration = 120, description = 'Defend captured zone' },
    },
    required_role  = nil,
    difficulty     = 'hard',
}

-- ============================================================
-- DEFEND MISSIONS
-- ============================================================

AWConfigData.mission['defend_base'] = {
    display        = 'Base Defense',
    type           = 'defend',
    description    = 'Enemy forces are attacking your base. Defend at all costs.',
    min_players    = 2,
    max_players    = 8,
    time_limit     = 1500,
    reward_credits = 2500,
    reward_xp      = 1000,
    objectives     = {
        { type = 'survive_waves', count = 5, description = 'Survive all attack waves' },
        { type = 'protect', target_type = 'base', description = 'Base health above 50%' },
    },
    required_role  = nil,
    difficulty     = 'hard',
}

-- ============================================================
-- DOGFIGHT MISSIONS
-- ============================================================

AWConfigData.mission['dogfight_arena'] = {
    display        = 'Dogfight Arena',
    type           = 'dogfight',
    description    = 'Free-for-all or team dogfight in a bounded arena.',
    min_players    = 2,
    max_players    = 8,
    time_limit     = 600,
    reward_credits = 1000,
    reward_xp      = 500,
    objectives     = {
        { type = 'kill', count = 5, description = 'Reach 5 kills' },
    },
    required_role  = 'fighter',
    difficulty     = 'medium',
}

AWConfigData.mission['dogfight_ace'] = {
    display        = 'Ace Duel',
    type           = 'dogfight',
    description    = '1v1 ace duel — prove your skill in single combat.',
    min_players    = 2,
    max_players    = 2,
    time_limit     = 480,
    reward_credits = 2000,
    reward_xp      = 750,
    objectives     = {
        { type = 'kill', count = 3, description = 'First to 3 kills wins' },
    },
    required_role  = nil,
    difficulty     = 'hard',
}

-- ============================================================
-- BOMBING MISSIONS
-- ============================================================

AWConfigData.mission['bombing_runway'] = {
    display        = 'Runway Denial',
    type           = 'bombing',
    description    = 'Crater the enemy runway to prevent scrambles.',
    min_players    = 2,
    max_players    = 4,
    time_limit     = 900,
    reward_credits = 2000,
    reward_xp      = 800,
    objectives     = {
        { type = 'destroy', target_type = 'runway', count = 1, description = 'Bomb the runway' },
        { type = 'rtb', description = 'Return to base safely' },
    },
    required_role  = 'bomber',
    difficulty     = 'hard',
}

AWConfigData.mission['bombing_convoy'] = {
    display        = 'Convoy Strike',
    type           = 'bombing',
    description    = 'Destroy a moving ground convoy before it reaches the safe zone.',
    min_players    = 1,
    max_players    = 4,
    time_limit     = 720,
    reward_credits = 1200,
    reward_xp      = 500,
    objectives     = {
        { type = 'destroy', target_type = 'vehicle', count = 6, description = 'Destroy convoy vehicles' },
    },
    required_role  = nil,
    difficulty     = 'medium',
}
