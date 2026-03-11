--[[
    aw-config — Rank Definitions
    Progressive rank system — XP thresholds, tier, display names, unlocks.
    Fields match AWConfigSchemas.rank.
]]

AWConfigData = AWConfigData or {}
AWConfigData.rank = AWConfigData.rank or {}

-- ============================================================
-- TIER 1 — RECRUIT (0 - 999 XP)
-- ============================================================

AWConfigData.rank['recruit'] = {
    display     = 'Recruit',
    short       = 'Rct',
    xp_required = 0,
    tier        = 1,
    unlocks     = {},
    icon        = 'rank_recruit',
}

AWConfigData.rank['airman'] = {
    display     = 'Airman',
    short       = 'Amn',
    xp_required = 500,
    tier        = 1,
    unlocks     = {
        'aircraft.trainer',
    },
    icon        = 'rank_airman',
}

-- ============================================================
-- TIER 2 — JUNIOR (1,000 - 4,999 XP)
-- ============================================================

AWConfigData.rank['airman_first'] = {
    display     = 'Airman First Class',
    short       = 'A1C',
    xp_required = 1000,
    tier        = 2,
    unlocks     = {
        'aircraft.fighter_basic',
        'loadout.customize',
        'chat.faction',
    },
    icon        = 'rank_a1c',
}

AWConfigData.rank['corporal'] = {
    display     = 'Corporal',
    short       = 'Cpl',
    xp_required = 2000,
    tier        = 2,
    unlocks     = {
        'aircraft.bomber_basic',
        'aircraft.transport_basic',
        'mission.join',
    },
    icon        = 'rank_corporal',
}

AWConfigData.rank['sergeant'] = {
    display     = 'Sergeant',
    short       = 'Sgt',
    xp_required = 3500,
    tier        = 2,
    unlocks     = {
        'aircraft.attacker_basic',
        'aircraft.recon_basic',
        'loadout.preset_save',
    },
    icon        = 'rank_sergeant',
}

-- ============================================================
-- TIER 3 — NON-COMMISSIONED (5,000 - 14,999 XP)
-- ============================================================

AWConfigData.rank['staff_sergeant'] = {
    display     = 'Staff Sergeant',
    short       = 'SSgt',
    xp_required = 5000,
    tier        = 3,
    unlocks     = {
        'aircraft.multirole',
        'aircraft.interceptor_basic',
        'mission.create_basic',
        'squadron.join',
    },
    icon        = 'rank_ssgt',
}

AWConfigData.rank['tech_sergeant'] = {
    display     = 'Technical Sergeant',
    short       = 'TSgt',
    xp_required = 7500,
    tier        = 3,
    unlocks     = {
        'aircraft.fighter_advanced',
        'weapon.guided_bombs',
        'weapon.bvr_missiles',
    },
    icon        = 'rank_tsgt',
}

AWConfigData.rank['master_sergeant'] = {
    display     = 'Master Sergeant',
    short       = 'MSgt',
    xp_required = 10000,
    tier        = 3,
    unlocks     = {
        'aircraft.bomber_advanced',
        'aircraft.awacs',
        'weapon.agm_missiles',
        'squadron.create',
    },
    icon        = 'rank_msgt',
}

-- ============================================================
-- TIER 4 — WARRANT / JUNIOR OFFICER (15,000 - 39,999 XP)
-- ============================================================

AWConfigData.rank['warrant_officer'] = {
    display     = 'Warrant Officer',
    short       = 'WO',
    xp_required = 15000,
    tier        = 4,
    unlocks     = {
        'aircraft.stealth_basic',
        'aircraft.gunship',
        'mission.create_advanced',
        'store.discount_5',
    },
    icon        = 'rank_wo',
}

AWConfigData.rank['second_lieutenant'] = {
    display     = 'Second Lieutenant',
    short       = '2Lt',
    xp_required = 20000,
    tier        = 4,
    unlocks     = {
        'aircraft.stealth_advanced',
        'aircraft.tanker',
        'weapon.cluster_bombs',
        'faction.vote',
    },
    icon        = 'rank_2lt',
}

AWConfigData.rank['first_lieutenant'] = {
    display     = 'First Lieutenant',
    short       = '1Lt',
    xp_required = 30000,
    tier        = 4,
    unlocks     = {
        'aircraft.all_conventional',
        'weapon.all_conventional',
        'mission.create_any',
        'store.discount_10',
    },
    icon        = 'rank_1lt',
}

-- ============================================================
-- TIER 5 — SENIOR OFFICER (40,000 - 99,999 XP)
-- ============================================================

AWConfigData.rank['captain'] = {
    display     = 'Captain',
    short       = 'Cpt',
    xp_required = 40000,
    tier        = 5,
    unlocks     = {
        'squadron.lead',
        'faction.officer',
        'aircraft.special_basic',
        'store.discount_15',
    },
    icon        = 'rank_captain',
}

AWConfigData.rank['major'] = {
    display     = 'Major',
    short       = 'Maj',
    xp_required = 60000,
    tier        = 5,
    unlocks     = {
        'war.start_vote',
        'faction.promote',
        'aircraft.special_advanced',
    },
    icon        = 'rank_major',
}

AWConfigData.rank['colonel'] = {
    display     = 'Colonel',
    short       = 'Col',
    xp_required = 85000,
    tier        = 5,
    unlocks     = {
        'faction.manage',
        'war.command',
        'squadron.manage_any',
        'store.discount_20',
    },
    icon        = 'rank_colonel',
}

-- ============================================================
-- TIER 6 — GENERAL (100,000+ XP)
-- ============================================================

AWConfigData.rank['brigadier_general'] = {
    display     = 'Brigadier General',
    short       = 'BGen',
    xp_required = 100000,
    tier        = 6,
    unlocks     = {
        'faction.leader',
        'war.declare',
        'admin.view_stats',
    },
    icon        = 'rank_bgen',
}

AWConfigData.rank['major_general'] = {
    display     = 'Major General',
    short       = 'MGen',
    xp_required = 150000,
    tier        = 6,
    unlocks     = {
        'aircraft.all',
        'weapon.all',
        'store.discount_25',
    },
    icon        = 'rank_mgen',
}

AWConfigData.rank['general'] = {
    display     = 'General',
    short       = 'Gen',
    xp_required = 250000,
    tier        = 6,
    unlocks     = {
        'admin.moderate',
        'war.strategy',
    },
    icon        = 'rank_general',
}

AWConfigData.rank['marshal'] = {
    display     = 'Air Marshal',
    short       = 'AM',
    xp_required = 500000,
    tier        = 6,
    unlocks     = {
        'admin.full',
        'aircraft.legendary',
        'title.marshal',
    },
    icon        = 'rank_marshal',
}
