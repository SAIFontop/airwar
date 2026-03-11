--[[
    aw-config — Economy Configuration
    Pricing, rewards, costs, multipliers, and economic constants.
    Loaded by server.lua and applied as AWConfigData.economy
]]

AWConfigData = AWConfigData or {}
AWConfigData.economy = AWConfigData.economy or {}

-- ============================================================
-- STARTING BALANCE & LIMITS
-- ============================================================

AWConfigData.economy.starting_credits     = 5000
AWConfigData.economy.max_credits          = 10000000
AWConfigData.economy.daily_login_bonus    = 250
AWConfigData.economy.daily_bonus_streak   = { 250, 300, 400, 500, 750, 1000, 2000 } -- 7-day streak

-- ============================================================
-- KILL REWARDS
-- ============================================================

AWConfigData.economy.rewards = {
    -- Air-to-Air
    kill_fighter       = { credits = 300,  xp = 150 },
    kill_bomber        = { credits = 400,  xp = 200 },
    kill_transport     = { credits = 150,  xp = 75  },
    kill_interceptor   = { credits = 350,  xp = 175 },
    kill_attacker      = { credits = 300,  xp = 150 },
    kill_multirole     = { credits = 350,  xp = 175 },
    kill_recon         = { credits = 200,  xp = 100 },
    kill_awacs         = { credits = 500,  xp = 250 },
    kill_tanker        = { credits = 400,  xp = 200 },
    kill_gunship       = { credits = 500,  xp = 250 },
    kill_drone         = { credits = 150,  xp = 75  },
    kill_stealth       = { credits = 600,  xp = 300 },
    kill_vtol          = { credits = 300,  xp = 150 },
    kill_trainer       = { credits = 100,  xp = 50  },

    -- Assists
    assist_kill        = { credits = 100,  xp = 50  },
    assist_damage      = { credits = 50,   xp = 25  },

    -- Streaks
    ace_in_a_day       = { credits = 2000, xp = 1000 }, -- 5 kills without dying
    double_ace         = { credits = 5000, xp = 2500 }, -- 10 kills without dying

    -- Ground targets
    kill_ground_light  = { credits = 100,  xp = 50  },
    kill_ground_heavy  = { credits = 250,  xp = 125 },
    kill_ground_aa     = { credits = 400,  xp = 200 },
    kill_structure     = { credits = 500,  xp = 250 },
}

-- ============================================================
-- MISSION REWARDS (multiplied by base mission reward)
-- ============================================================

AWConfigData.economy.mission_multipliers = {
    easy    = 1.0,
    medium  = 1.5,
    hard    = 2.0,
    extreme = 3.0,
}

AWConfigData.economy.mission_completion_bonus = 500  -- flat bonus on top of template reward
AWConfigData.economy.mission_perfect_bonus    = 1000 -- no deaths during mission
AWConfigData.economy.mission_speed_bonus      = 250  -- completed in < 50% time

-- ============================================================
-- ZONE / WAR REWARDS
-- ============================================================

AWConfigData.economy.zone_capture_reward    = { credits = 1500, xp = 600 }
AWConfigData.economy.zone_defend_reward     = { credits = 800,  xp = 300 }
AWConfigData.economy.zone_hold_per_minute   = { credits = 50,   xp = 20  }
AWConfigData.economy.war_victory_reward     = { credits = 5000, xp = 2000 }
AWConfigData.economy.war_participation      = { credits = 1000, xp = 500  }

-- ============================================================
-- SERVICE COSTS (at bases)
-- ============================================================

AWConfigData.economy.services = {
    repair = {
        per_percent  = 10,   -- cost per 1% of health restored
        minimum      = 50,
        maximum      = 5000,
    },
    rearm = {
        per_weapon   = 100,  -- cost per weapon slot rearmed
        per_ammo_pct = 5,    -- cost per 1% ammo restored on guns
        minimum      = 50,
    },
    refuel = {
        per_percent  = 5,    -- cost per 1% fuel restored
        minimum      = 25,
        maximum      = 2000,
    },
    respray = {
        flat_cost    = 500,
    },
}

-- ============================================================
-- AIRCRAFT PRICING TIERS
-- ============================================================

AWConfigData.economy.aircraft_tier_prices = {
    [1] = 0,       -- Starter / free
    [2] = 2500,
    [3] = 7500,
    [4] = 15000,
    [5] = 35000,
    [6] = 75000,
    [7] = 150000,
    [8] = 300000,
    [9] = 500000,
    [10] = 1000000, -- Legendary
}

-- ============================================================
-- WEAPON PRICING TIERS
-- ============================================================

AWConfigData.economy.weapon_tier_prices = {
    [1] = 0,
    [2] = 500,
    [3] = 1500,
    [4] = 3000,
    [5] = 7500,
}

-- ============================================================
-- LOADOUT PRICING TIERS
-- ============================================================

AWConfigData.economy.loadout_tier_prices = {
    [1] = 0,
    [2] = 1000,
    [3] = 3000,
    [4] = 8000,
    [5] = 20000,
}

-- ============================================================
-- INSURANCE / LOSS PENALTY
-- ============================================================

AWConfigData.economy.insurance = {
    enabled          = true,
    cost_multiplier  = 0.10, -- 10% of aircraft price to insure
    payout_percent   = 0.50, -- get 50% back if destroyed while insured
    uninsured_loss   = true, -- lose the aircraft permanently if uninsured
}

-- ============================================================
-- RANK XP MULTIPLIERS
-- ============================================================

AWConfigData.economy.xp_multipliers = {
    faction_bonus   = 0.10, -- +10% XP for faction members
    squadron_bonus  = 0.15, -- +15% XP when in a squadron
    war_bonus       = 0.25, -- +25% XP during active war
    weekend_bonus   = 0.10, -- +10% XP on weekends (Fri-Sun)
    underdog_bonus  = 0.20, -- +20% XP for faction with fewest members
}

-- ============================================================
-- ECONOMY LIMITS & ANTI-EXPLOIT
-- ============================================================

AWConfigData.economy.limits = {
    max_earn_per_hour       = 50000,   -- credit cap per hour
    max_xp_per_hour         = 25000,   -- XP cap per hour
    min_kill_interval       = 10,      -- seconds — kills faster than this are suspicious
    max_transactions_minute = 30,      -- rate limit on purchases
    cooldown_insurance      = 300,     -- 5 min cooldown after insurance payout
}
