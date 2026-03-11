--[[
    aw-config — Loadout Presets
    Default weapon loadout configurations per aircraft role.
    Each preset maps hardpoint indices → weapon type IDs.
    Referenced by aw-loadout module during aircraft spawn/rearm.
]]

AWConfigData = AWConfigData or {}
AWConfigData.loadout = AWConfigData.loadout or {}

-- ============================================================
-- FIGHTER LOADOUTS
-- ============================================================

AWConfigData.loadout['fighter_default'] = {
    display = 'Fighter — Air Superiority',
    role    = 'fighter',
    slots   = {
        { slot = 1, weapon = 'm61_vulcan',      qty = 1 },
        { slot = 2, weapon = 'aim9_sidewinder',  qty = 2 },
        { slot = 3, weapon = 'aim120_amraam',    qty = 2 },
        { slot = 4, weapon = 'aim9_sidewinder',  qty = 2 },
        { slot = 5, weapon = 'aim120_amraam',    qty = 2 },
    },
    price = 0,
    tier  = 'basic',
    description = 'Standard air superiority — 2x IR, 4x radar BVR',
}

AWConfigData.loadout['fighter_dogfight'] = {
    display = 'Fighter — Dogfight',
    role    = 'fighter',
    slots   = {
        { slot = 1, weapon = 'm61_vulcan',     qty = 1 },
        { slot = 2, weapon = 'aim9x',          qty = 2 },
        { slot = 3, weapon = 'aim9x',          qty = 2 },
        { slot = 4, weapon = 'aim9_sidewinder', qty = 2 },
        { slot = 5, weapon = 'aim9_sidewinder', qty = 2 },
    },
    price = 8000,
    tier  = 'advanced',
    description = 'Close-range dogfight — all IR missiles',
}

AWConfigData.loadout['fighter_bvr'] = {
    display = 'Fighter — BVR Hunter',
    role    = 'fighter',
    slots   = {
        { slot = 1, weapon = 'm61a2',         qty = 1 },
        { slot = 2, weapon = 'aim120d',        qty = 2 },
        { slot = 3, weapon = 'aim120d',        qty = 2 },
        { slot = 4, weapon = 'aim120_amraam',  qty = 2 },
        { slot = 5, weapon = 'aim9x',          qty = 2 },
    },
    price = 20000,
    tier  = 'elite',
    description = 'Long-range engagement — 6x AMRAAM, 2x Sidewinder',
}

-- ============================================================
-- BOMBER LOADOUTS
-- ============================================================

AWConfigData.loadout['bomber_default'] = {
    display = 'Bomber — General Purpose',
    role    = 'bomber',
    slots   = {
        { slot = 1, weapon = 'mk82',          qty = 6 },
        { slot = 2, weapon = 'mk83',          qty = 4 },
        { slot = 3, weapon = 'aim9_sidewinder', qty = 2 },
    },
    price = 0,
    tier  = 'basic',
    description = 'Mixed bomb load — 6x 500lb, 4x 1000lb, self-defence',
}

AWConfigData.loadout['bomber_precision'] = {
    display = 'Bomber — Precision Strike',
    role    = 'bomber',
    slots   = {
        { slot = 1, weapon = 'gbu38_jdam',    qty = 4 },
        { slot = 2, weapon = 'gbu31_jdam',    qty = 2 },
        { slot = 3, weapon = 'aim9_sidewinder', qty = 2 },
    },
    price = 12000,
    tier  = 'advanced',
    description = 'GPS-guided precision — JDAMs with self-defence',
}

AWConfigData.loadout['bomber_heavy'] = {
    display = 'Bomber — Heavy Carpet',
    role    = 'bomber',
    slots   = {
        { slot = 1, weapon = 'mk84',          qty = 2 },
        { slot = 2, weapon = 'mk83',          qty = 4 },
        { slot = 3, weapon = 'mk82',          qty = 6 },
        { slot = 4, weapon = 'mk82',          qty = 6 },
    },
    price = 8000,
    tier  = 'advanced',
    description = 'Maximum bomb load — carpet bombing',
}

-- ============================================================
-- ATTACKER LOADOUTS (A-10, Su-25, etc.)
-- ============================================================

AWConfigData.loadout['attacker_default'] = {
    display = 'Attacker — CAS Standard',
    role    = 'attacker',
    slots   = {
        { slot = 1, weapon = 'gau8_avenger',   qty = 1 },
        { slot = 2, weapon = 'agm65_maverick',  qty = 2 },
        { slot = 3, weapon = 'hydra70',          qty = 1 },
        { slot = 4, weapon = 'aim9_sidewinder',  qty = 2 },
    },
    price = 0,
    tier  = 'basic',
    description = 'Close air support — gun, Mavericks, rockets, self-defence',
}

AWConfigData.loadout['attacker_antiarmor'] = {
    display = 'Attacker — Anti-Armor',
    role    = 'attacker',
    slots   = {
        { slot = 1, weapon = 'gau8_avenger',   qty = 1 },
        { slot = 2, weapon = 'agm65_maverick',  qty = 2 },
        { slot = 3, weapon = 'agm65_maverick',  qty = 2 },
        { slot = 4, weapon = 'gbu12',           qty = 4 },
        { slot = 5, weapon = 'aim9_sidewinder',  qty = 2 },
    },
    price = 14000,
    tier  = 'advanced',
    description = 'Full anti-tank loadout — 4x Maverick, LGBs',
}

AWConfigData.loadout['attacker_sead'] = {
    display = 'Attacker — SEAD',
    role    = 'attacker',
    slots   = {
        { slot = 1, weapon = 'm61_vulcan',     qty = 1 },
        { slot = 2, weapon = 'agm88_harm',      qty = 2 },
        { slot = 3, weapon = 'agm88_harm',      qty = 2 },
        { slot = 4, weapon = 'aim120_amraam',    qty = 2 },
        { slot = 5, weapon = 'aim9x',            qty = 2 },
    },
    price = 25000,
    tier  = 'elite',
    description = 'Suppression of enemy air defenses — 4x HARM',
}

-- ============================================================
-- MULTIROLE LOADOUTS
-- ============================================================

AWConfigData.loadout['multirole_balanced'] = {
    display = 'Multirole — Balanced',
    role    = 'multirole',
    slots   = {
        { slot = 1, weapon = 'm61_vulcan',      qty = 1 },
        { slot = 2, weapon = 'aim9_sidewinder',  qty = 2 },
        { slot = 3, weapon = 'aim120_amraam',    qty = 2 },
        { slot = 4, weapon = 'gbu38_jdam',       qty = 2 },
        { slot = 5, weapon = 'agm65_maverick',   qty = 2 },
    },
    price = 10000,
    tier  = 'advanced',
    description = 'Air-to-air and air-to-ground balanced mix',
}

AWConfigData.loadout['multirole_strike'] = {
    display = 'Multirole — Strike',
    role    = 'multirole',
    slots   = {
        { slot = 1, weapon = 'm61_vulcan',     qty = 1 },
        { slot = 2, weapon = 'gbu12',           qty = 4 },
        { slot = 3, weapon = 'gbu31_jdam',      qty = 2 },
        { slot = 4, weapon = 'aim9_sidewinder',  qty = 2 },
    },
    price = 12000,
    tier  = 'advanced',
    description = 'Ground strike priority — LGBs and JDAMs',
}

-- ============================================================
-- INTERCEPTOR LOADOUTS
-- ============================================================

AWConfigData.loadout['interceptor_default'] = {
    display = 'Interceptor — Sprint',
    role    = 'interceptor',
    slots   = {
        { slot = 1, weapon = 'aim120d',        qty = 2 },
        { slot = 2, weapon = 'aim120d',        qty = 2 },
        { slot = 3, weapon = 'aim9x',          qty = 2 },
    },
    price = 18000,
    tier  = 'elite',
    description = 'Maximum BVR — 4x AIM-120D for intercept missions',
}

-- ============================================================
-- GUNSHIP LOADOUTS (AC-130)
-- ============================================================

AWConfigData.loadout['gunship_default'] = {
    display = 'Gunship — Standard',
    role    = 'gunship',
    slots   = {
        { slot = 1, weapon = 'gau12_equalizer', qty = 1 },
        { slot = 2, weapon = 'l60_bofors',       qty = 1 },
        { slot = 3, weapon = 'm102_howitzer',    qty = 1 },
    },
    price = 0,
    tier  = 'advanced',
    description = 'AC-130 standard — 25mm, 40mm, 105mm',
}

-- ============================================================
-- DRONE LOADOUTS
-- ============================================================

AWConfigData.loadout['drone_recon'] = {
    display = 'Drone — Reconnaissance',
    role    = 'drone',
    slots   = {},
    price = 0,
    tier  = 'basic',
    description = 'Unarmed surveillance drone',
}

AWConfigData.loadout['drone_strike'] = {
    display = 'Drone — Strike',
    role    = 'drone',
    slots   = {
        { slot = 1, weapon = 'agm114_hellfire', qty = 4 },
        { slot = 2, weapon = 'gbu39_sdb',       qty = 2 },
    },
    price = 15000,
    tier  = 'advanced',
    description = 'Armed UCAV — Hellfires and SDBs',
}

-- ============================================================
-- RUSSIAN EQUIVALENTS
-- ============================================================

AWConfigData.loadout['rus_fighter_default'] = {
    display = 'RUS Fighter — Standard',
    role    = 'fighter',
    slots   = {
        { slot = 1, weapon = 'gsh30_1',         qty = 1 },
        { slot = 2, weapon = 'r73_archer',       qty = 2 },
        { slot = 3, weapon = 'r77_adder',        qty = 2 },
        { slot = 4, weapon = 'r73_archer',       qty = 2 },
        { slot = 5, weapon = 'r77_adder',        qty = 2 },
    },
    price = 0,
    tier  = 'basic',
    description = 'Standard Russian air superiority loadout',
}

AWConfigData.loadout['rus_attacker_default'] = {
    display = 'RUS Attacker — CAS',
    role    = 'attacker',
    slots   = {
        { slot = 1, weapon = 'gsh30_2',         qty = 1 },
        { slot = 2, weapon = 'kh29',             qty = 2 },
        { slot = 3, weapon = 's8',               qty = 1 },
        { slot = 4, weapon = 'fab250',           qty = 4 },
        { slot = 5, weapon = 'r73_archer',       qty = 2 },
    },
    price = 0,
    tier  = 'basic',
    description = 'Russian CAS — Kedge AGMs, rockets, bombs',
}

AWConfigData.loadout['rus_bomber_default'] = {
    display = 'RUS Bomber — Strike',
    role    = 'bomber',
    slots   = {
        { slot = 1, weapon = 'fab500',           qty = 4 },
        { slot = 2, weapon = 'kab500',           qty = 2 },
        { slot = 3, weapon = 'r73_archer',       qty = 2 },
    },
    price = 4000,
    tier  = 'basic',
    description = 'Mixed Russian bomb load',
}

-- ============================================================
-- CHINESE EQUIVALENTS
-- ============================================================

AWConfigData.loadout['chn_fighter_default'] = {
    display = 'CHN Fighter — Standard',
    role    = 'fighter',
    slots   = {
        { slot = 1, weapon = 'type23_1',         qty = 1 },
        { slot = 2, weapon = 'pl5',              qty = 2 },
        { slot = 3, weapon = 'pl12',             qty = 2 },
        { slot = 4, weapon = 'pl5',              qty = 2 },
        { slot = 5, weapon = 'pl12',             qty = 2 },
    },
    price = 0,
    tier  = 'basic',
    description = 'Standard Chinese air superiority loadout',
}

AWConfigData.loadout['chn_elite'] = {
    display = 'CHN Elite — J-20',
    role    = 'stealth',
    slots   = {
        { slot = 1, weapon = 'type23_1',         qty = 1 },
        { slot = 2, weapon = 'pl10',             qty = 2 },
        { slot = 3, weapon = 'pl15',             qty = 4 },
        { slot = 4, weapon = 'pl10',             qty = 2 },
    },
    price = 30000,
    tier  = 'elite',
    description = 'J-20 stealth hunter — PL-10 short + PL-15 BVR',
}

-- ============================================================
-- EUROPEAN EQUIVALENTS
-- ============================================================

AWConfigData.loadout['eu_fighter_default'] = {
    display = 'EU Fighter — Standard',
    role    = 'fighter',
    slots   = {
        { slot = 1, weapon = 'defa_554',         qty = 1 },
        { slot = 2, weapon = 'mica_ir',          qty = 2 },
        { slot = 3, weapon = 'mica_rf',          qty = 2 },
        { slot = 4, weapon = 'mica_ir',          qty = 2 },
        { slot = 5, weapon = 'meteor',           qty = 2 },
    },
    price = 15000,
    tier  = 'advanced',
    description = 'Rafale/Eurofighter standard — MICA + Meteor',
}

-- ============================================================
-- SCI-FI LOADOUTS
-- ============================================================

AWConfigData.loadout['scifi_fighter'] = {
    display = 'Sci-Fi Fighter',
    role    = 'fighter',
    slots   = {
        { slot = 1, weapon = 'laser_blaster',       qty = 1 },
        { slot = 2, weapon = 'proton_torpedo',       qty = 4 },
        { slot = 3, weapon = 'concussion_missile',   qty = 6 },
    },
    price = 20000,
    tier  = 'special',
    description = 'Sci-fi energy weapons loadout',
}
