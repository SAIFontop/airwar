--[[
    aw-config — Weapon Data: Bombs & Rockets
    Dumb bombs, guided bombs, rocket pods, torpedoes.
    Fields match AWConfigSchemas.weapon.
]]

AWConfigData = AWConfigData or {}
AWConfigData.weapon = AWConfigData.weapon or {}

-- ============================================================
-- UNGUIDED BOMBS (dumb)
-- ============================================================

AWConfigData.weapon['mk82'] = {
    display     = 'Mk 82 (500 lb)',
    type        = 'bomb_dumb',
    damage      = 600,
    range       = 0,
    speed       = 0,
    ammo        = 6,
    splash      = 15.0,
    guidance    = 'none',
    counterable = 'none',
    weight      = 227,
    price       = 1000,
    tier        = 'basic',
    description = 'Standard 500 lb general-purpose bomb',
}

AWConfigData.weapon['mk83'] = {
    display     = 'Mk 83 (1000 lb)',
    type        = 'bomb_dumb',
    damage      = 800,
    range       = 0,
    speed       = 0,
    ammo        = 4,
    splash      = 20.0,
    guidance    = 'none',
    counterable = 'none',
    weight      = 454,
    price       = 2000,
    tier        = 'basic',
    description = '1000 lb GP bomb — medium strike ordnance',
}

AWConfigData.weapon['mk84'] = {
    display     = 'Mk 84 (2000 lb)',
    type        = 'bomb_dumb',
    damage      = 1200,
    range       = 0,
    speed       = 0,
    ammo        = 2,
    splash      = 30.0,
    guidance    = 'none',
    counterable = 'none',
    weight      = 907,
    price       = 4000,
    tier        = 'advanced',
    description = '2000 lb bunker-cracker — devastating on impact',
}

AWConfigData.weapon['fab250'] = {
    display     = 'FAB-250',
    type        = 'bomb_dumb',
    damage      = 650,
    range       = 0,
    speed       = 0,
    ammo        = 6,
    splash      = 16.0,
    guidance    = 'none',
    counterable = 'none',
    weight      = 250,
    price       = 1200,
    tier        = 'basic',
    description = 'Russian 250 kg GP bomb — standard Su-24/25 ordnance',
}

AWConfigData.weapon['fab500'] = {
    display     = 'FAB-500',
    type        = 'bomb_dumb',
    damage      = 900,
    range       = 0,
    speed       = 0,
    ammo        = 4,
    splash      = 22.0,
    guidance    = 'none',
    counterable = 'none',
    weight      = 500,
    price       = 2500,
    tier        = 'basic',
    description = 'Russian 500 kg bomb — primary bomber ordnance',
}

AWConfigData.weapon['fab1500'] = {
    display     = 'FAB-1500',
    type        = 'bomb_dumb',
    damage      = 1500,
    range       = 0,
    speed       = 0,
    ammo        = 1,
    splash      = 40.0,
    guidance    = 'none',
    counterable = 'none',
    weight      = 1500,
    price       = 6000,
    tier        = 'advanced',
    description = 'Russian 1500 kg heavy bomb — area denial',
}

-- ============================================================
-- GUIDED BOMBS (JDAM / LGB)
-- ============================================================

AWConfigData.weapon['gbu12'] = {
    display     = 'GBU-12 Paveway II',
    type        = 'bomb_guided',
    damage      = 650,
    range       = 3000,
    speed       = 0,
    ammo        = 4,
    lock_time   = 2.0,
    lock_cone   = 15,
    lock_range  = 8000,
    splash      = 12.0,
    guidance    = 'laser',
    counterable = 'none',
    weight      = 230,
    price       = 4000,
    tier        = 'advanced',
    description = 'Laser-guided 500 lb — precision CAS staple',
}

AWConfigData.weapon['gbu10'] = {
    display     = 'GBU-10 Paveway II',
    type        = 'bomb_guided',
    damage      = 1200,
    range       = 3000,
    speed       = 0,
    ammo        = 2,
    lock_time   = 2.5,
    lock_cone   = 15,
    lock_range  = 8000,
    splash      = 25.0,
    guidance    = 'laser',
    counterable = 'none',
    weight      = 930,
    price       = 6000,
    tier        = 'advanced',
    description = 'Laser-guided 2000 lb — heavy precision strike',
}

AWConfigData.weapon['gbu31_jdam'] = {
    display     = 'GBU-31 JDAM',
    type        = 'bomb_guided',
    damage      = 1200,
    range       = 4000,
    speed       = 0,
    ammo        = 2,
    lock_time   = 0.0,
    lock_cone   = 0,
    lock_range  = 0,
    splash      = 28.0,
    guidance    = 'gps',
    counterable = 'none',
    weight      = 925,
    price       = 5000,
    tier        = 'advanced',
    description = '2000 lb GPS-guided — all-weather precision',
}

AWConfigData.weapon['gbu38_jdam'] = {
    display     = 'GBU-38 JDAM',
    type        = 'bomb_guided',
    damage      = 600,
    range       = 4000,
    speed       = 0,
    ammo        = 4,
    lock_time   = 0.0,
    lock_cone   = 0,
    lock_range  = 0,
    splash      = 14.0,
    guidance    = 'gps',
    counterable = 'none',
    weight      = 241,
    price       = 3000,
    tier        = 'advanced',
    description = '500 lb GPS JDAM — workhorse precision bomb',
}

AWConfigData.weapon['gbu39_sdb'] = {
    display     = 'GBU-39 SDB',
    type        = 'bomb_guided',
    damage      = 300,
    range       = 6000,
    speed       = 0,
    ammo        = 8,
    lock_time   = 0.0,
    lock_cone   = 0,
    lock_range  = 0,
    splash      = 8.0,
    guidance    = 'gps',
    counterable = 'none',
    weight      = 113,
    price       = 4000,
    tier        = 'advanced',
    description = 'Small Diameter Bomb — long glide range, low collateral',
}

AWConfigData.weapon['kab500'] = {
    display     = 'KAB-500L',
    type        = 'bomb_guided',
    damage      = 900,
    range       = 3000,
    speed       = 0,
    ammo        = 2,
    lock_time   = 2.5,
    lock_cone   = 15,
    lock_range  = 6000,
    splash      = 20.0,
    guidance    = 'laser',
    counterable = 'none',
    weight      = 534,
    price       = 4500,
    tier        = 'advanced',
    description = 'Russian laser-guided 500 kg — Su-24/34',
}

AWConfigData.weapon['kab1500'] = {
    display     = 'KAB-1500L',
    type        = 'bomb_guided',
    damage      = 1500,
    range       = 2000,
    speed       = 0,
    ammo        = 1,
    lock_time   = 3.0,
    lock_cone   = 12,
    lock_range  = 8000,
    splash      = 35.0,
    guidance    = 'laser',
    counterable = 'none',
    weight      = 1525,
    price       = 8000,
    tier        = 'elite',
    description = 'Russian 1500 kg guided — bunker penetrator',
}

-- ============================================================
-- CLUSTER MUNITIONS
-- ============================================================

AWConfigData.weapon['cbu87'] = {
    display     = 'CBU-87 CEM',
    type        = 'bomb_dumb',
    damage      = 400,
    range       = 0,
    speed       = 0,
    ammo        = 4,
    splash      = 50.0,
    guidance    = 'none',
    counterable = 'none',
    weight      = 430,
    price       = 5000,
    tier        = 'advanced',
    description = 'Cluster bomb — 202 bomblets, wide area denial',
}

AWConfigData.weapon['cbu97_sfw'] = {
    display     = 'CBU-97 SFW',
    type        = 'bomb_guided',
    damage      = 500,
    range       = 2000,
    speed       = 0,
    ammo        = 2,
    lock_time   = 0.0,
    lock_cone   = 0,
    lock_range  = 0,
    splash      = 40.0,
    guidance    = 'gps',
    counterable = 'none',
    weight      = 420,
    price       = 7000,
    tier        = 'elite',
    description = 'Sensor-fuzed anti-armor — skeet submunitions',
}

-- ============================================================
-- ROCKET PODS
-- ============================================================

AWConfigData.weapon['hydra70'] = {
    display     = 'Hydra 70 (M261)',
    type        = 'rocket',
    damage      = 150,
    range       = 3000,
    speed       = 740,
    ammo        = 19,
    fire_rate   = 6,
    splash      = 8.0,
    guidance    = 'none',
    counterable = 'none',
    weight      = 200,
    price       = 2000,
    tier        = 'basic',
    description = '2.75\" FFAR rocket pod — 19 per pod, area suppression',
}

AWConfigData.weapon['apkws'] = {
    display     = 'APKWS II',
    type        = 'rocket',
    damage      = 200,
    range       = 5000,
    speed       = 740,
    ammo        = 7,
    fire_rate   = 3,
    lock_time   = 1.5,
    lock_cone   = 20,
    lock_range  = 5000,
    splash      = 4.0,
    guidance    = 'laser',
    counterable = 'none',
    weight      = 220,
    price       = 5000,
    tier        = 'advanced',
    description = 'Laser-guided Hydra — precision rocket, low collateral',
}

AWConfigData.weapon['s8'] = {
    display     = 'S-8 (B-8V20A)',
    type        = 'rocket',
    damage      = 140,
    range       = 2500,
    speed       = 610,
    ammo        = 20,
    fire_rate   = 6,
    splash      = 7.0,
    guidance    = 'none',
    counterable = 'none',
    weight      = 180,
    price       = 1500,
    tier        = 'basic',
    description = 'Russian 80mm FFAR pod — 20 rockets, area saturation',
}

AWConfigData.weapon['s13'] = {
    display     = 'S-13 (B-13L)',
    type        = 'rocket',
    damage      = 250,
    range       = 3000,
    speed       = 530,
    ammo        = 5,
    fire_rate   = 2,
    splash      = 12.0,
    guidance    = 'none',
    counterable = 'none',
    weight      = 300,
    price       = 2500,
    tier        = 'advanced',
    description = 'Russian 122mm heavy rocket — anti-hardpoint',
}

AWConfigData.weapon['s25'] = {
    display     = 'S-25 OFM',
    type        = 'rocket',
    damage      = 400,
    range       = 3000,
    speed       = 500,
    ammo        = 1,
    fire_rate   = 1,
    splash      = 20.0,
    guidance    = 'none',
    counterable = 'none',
    weight      = 380,
    price       = 3000,
    tier        = 'advanced',
    description = 'Russian 340mm heavy single rocket — bunker breaker',
}

-- ============================================================
-- TORPEDOES
-- ============================================================

AWConfigData.weapon['mk46_torpedo'] = {
    display     = 'Mk 46 Torpedo',
    type        = 'torpedo',
    damage      = 700,
    range       = 4000,
    speed       = 25,
    ammo        = 1,
    lock_time   = 3.0,
    lock_cone   = 20,
    lock_range  = 4000,
    splash      = 10.0,
    guidance    = 'ir',
    counterable = 'none',
    weight      = 230,
    price       = 6000,
    tier        = 'advanced',
    description = 'Lightweight ASW torpedo — patrol aircraft',
}

AWConfigData.weapon['mk50_torpedo'] = {
    display     = 'Mk 50 Barracuda',
    type        = 'torpedo',
    damage      = 900,
    range       = 6000,
    speed       = 30,
    ammo        = 1,
    lock_time   = 2.5,
    lock_cone   = 25,
    lock_range  = 6000,
    splash      = 12.0,
    guidance    = 'ir',
    counterable = 'none',
    weight      = 362,
    price       = 10000,
    tier        = 'elite',
    description = 'Advanced lightweight torpedo — deep water capable',
}
