--[[
    aw-config — Weapon Data: Missiles
    Air-to-air (AIM), air-to-ground (AGM) missiles.
    Fields match AWConfigSchemas.weapon.
]]

AWConfigData = AWConfigData or {}
AWConfigData.weapon = AWConfigData.weapon or {}

-- ============================================================
-- AIR-TO-AIR: INFRARED (heat-seeking)
-- ============================================================

AWConfigData.weapon['aim9_sidewinder'] = {
    display     = 'AIM-9 Sidewinder',
    type        = 'aim_ir',
    damage      = 300,
    range       = 5000,
    speed       = 900,
    ammo        = 2,
    lock_time   = 2.5,
    lock_cone   = 30,
    lock_range  = 5000,
    guidance    = 'ir',
    counterable = 'flare',
    weight      = 85,
    price       = 3000,
    tier        = 'basic',
    description = 'Standard short-range IR missile — US/NATO fighters',
}

AWConfigData.weapon['aim9x'] = {
    display     = 'AIM-9X Sidewinder II',
    type        = 'aim_ir',
    damage      = 350,
    range       = 6000,
    speed       = 1000,
    ammo        = 2,
    lock_time   = 1.5,
    lock_cone   = 60,
    lock_range  = 6000,
    guidance    = 'ir',
    counterable = 'flare',
    weight      = 86,
    price       = 6000,
    tier        = 'advanced',
    description = 'Advanced short-range — high off-boresight, LOAL capable',
}

AWConfigData.weapon['r73_archer'] = {
    display     = 'R-73 Archer',
    type        = 'aim_ir',
    damage      = 320,
    range       = 5500,
    speed       = 950,
    ammo        = 2,
    lock_time   = 2.0,
    lock_cone   = 45,
    lock_range  = 5500,
    guidance    = 'ir',
    counterable = 'flare',
    weight      = 105,
    price       = 3500,
    tier        = 'basic',
    description = 'Russian high-agility dogfight missile — MiG-29, Su-27',
}

AWConfigData.weapon['r74m'] = {
    display     = 'R-74M',
    type        = 'aim_ir',
    damage      = 360,
    range       = 7000,
    speed       = 1050,
    ammo        = 2,
    lock_time   = 1.3,
    lock_cone   = 60,
    lock_range  = 7000,
    guidance    = 'ir',
    counterable = 'flare',
    weight      = 110,
    price       = 7000,
    tier        = 'advanced',
    description = 'Russian next-gen IR missile — Su-35, Su-57',
}

AWConfigData.weapon['iris_t'] = {
    display     = 'IRIS-T',
    type        = 'aim_ir',
    damage      = 340,
    range       = 5500,
    speed       = 950,
    ammo        = 2,
    lock_time   = 1.8,
    lock_cone   = 50,
    lock_range  = 5500,
    guidance    = 'ir',
    counterable = 'flare',
    weight      = 88,
    price       = 5000,
    tier        = 'advanced',
    description = 'European dogfight missile — Eurofighter, Gripen',
}

AWConfigData.weapon['mica_ir'] = {
    display     = 'MICA IR',
    type        = 'aim_ir',
    damage      = 330,
    range       = 8000,
    speed       = 1000,
    ammo        = 2,
    lock_time   = 2.0,
    lock_cone   = 40,
    lock_range  = 8000,
    guidance    = 'ir',
    counterable = 'flare',
    weight      = 112,
    price       = 5500,
    tier        = 'advanced',
    description = 'French dual-role IR missile — Rafale, Mirage',
}

AWConfigData.weapon['pl5'] = {
    display     = 'PL-5E',
    type        = 'aim_ir',
    damage      = 280,
    range       = 4500,
    speed       = 850,
    ammo        = 2,
    lock_time   = 2.8,
    lock_cone   = 25,
    lock_range  = 4500,
    guidance    = 'ir',
    counterable = 'flare',
    weight      = 85,
    price       = 2000,
    tier        = 'basic',
    description = 'Chinese short-range IR — J-10, JF-17',
}

AWConfigData.weapon['pl10'] = {
    display     = 'PL-10',
    type        = 'aim_ir',
    damage      = 370,
    range       = 7000,
    speed       = 1050,
    ammo        = 2,
    lock_time   = 1.2,
    lock_cone   = 70,
    lock_range  = 7000,
    guidance    = 'ir',
    counterable = 'flare',
    weight      = 105,
    price       = 8000,
    tier        = 'elite',
    description = 'Chinese advanced — extreme off-boresight, J-20/J-31',
}

-- ============================================================
-- AIR-TO-AIR: RADAR-GUIDED (BVR)
-- ============================================================

AWConfigData.weapon['aim120_amraam'] = {
    display     = 'AIM-120C AMRAAM',
    type        = 'aim_radar',
    damage      = 400,
    range       = 12000,
    speed       = 1350,
    ammo        = 2,
    lock_time   = 4.0,
    lock_cone   = 20,
    lock_range  = 12000,
    guidance    = 'radar',
    counterable = 'chaff',
    weight      = 152,
    price       = 8000,
    tier        = 'advanced',
    description = 'Standard BVR missile — US/NATO mainstay, fire-and-forget',
}

AWConfigData.weapon['aim120d'] = {
    display     = 'AIM-120D AMRAAM',
    type        = 'aim_radar',
    damage      = 420,
    range       = 16000,
    speed       = 1400,
    ammo        = 2,
    lock_time   = 3.5,
    lock_cone   = 22,
    lock_range  = 16000,
    guidance    = 'radar',
    counterable = 'chaff',
    weight      = 162,
    price       = 12000,
    tier        = 'elite',
    description = 'Extended range AMRAAM — two-way datalink, GPS midcourse',
}

AWConfigData.weapon['r77_adder'] = {
    display     = 'R-77 Adder',
    type        = 'aim_radar',
    damage      = 380,
    range       = 11000,
    speed       = 1300,
    ammo        = 2,
    lock_time   = 4.2,
    lock_cone   = 18,
    lock_range  = 11000,
    guidance    = 'radar',
    counterable = 'chaff',
    weight      = 175,
    price       = 7000,
    tier        = 'advanced',
    description = 'Russian active-radar BVR — grid fins',
}

AWConfigData.weapon['r77m'] = {
    display     = 'R-77M',
    type        = 'aim_radar',
    damage      = 430,
    range       = 18000,
    speed       = 1400,
    ammo        = 2,
    lock_time   = 3.2,
    lock_cone   = 22,
    lock_range  = 18000,
    guidance    = 'radar',
    counterable = 'chaff',
    weight      = 190,
    price       = 14000,
    tier        = 'elite',
    description = 'Russian next-gen BVR — AESA seeker, extreme range',
}

AWConfigData.weapon['r37m'] = {
    display     = 'R-37M',
    type        = 'aim_radar',
    damage      = 500,
    range       = 30000,
    speed       = 1800,
    ammo        = 1,
    lock_time   = 5.0,
    lock_cone   = 15,
    lock_range  = 30000,
    guidance    = 'radar',
    counterable = 'chaff',
    weight      = 510,
    price       = 20000,
    tier        = 'elite',
    description = 'Russian ultra-long-range — kills AWACS and tankers',
}

AWConfigData.weapon['meteor'] = {
    display     = 'Meteor',
    type        = 'aim_radar',
    damage      = 440,
    range       = 18000,
    speed       = 1500,
    ammo        = 2,
    lock_time   = 3.8,
    lock_cone   = 20,
    lock_range  = 18000,
    guidance    = 'radar',
    counterable = 'chaff',
    weight      = 185,
    price       = 15000,
    tier        = 'elite',
    description = 'Euroepan ramjet BVR — no-escape zone unmatched',
}

AWConfigData.weapon['mica_rf'] = {
    display     = 'MICA EM',
    type        = 'aim_radar',
    damage      = 350,
    range       = 10000,
    speed       = 1100,
    ammo        = 2,
    lock_time   = 3.5,
    lock_cone   = 25,
    lock_range  = 10000,
    guidance    = 'radar',
    counterable = 'chaff',
    weight      = 112,
    price       = 6000,
    tier        = 'advanced',
    description = 'French radar MICA — dual-use with IR variant',
}

AWConfigData.weapon['pl12'] = {
    display     = 'PL-12',
    type        = 'aim_radar',
    damage      = 370,
    range       = 11000,
    speed       = 1300,
    ammo        = 2,
    lock_time   = 4.0,
    lock_cone   = 18,
    lock_range  = 11000,
    guidance    = 'radar',
    counterable = 'chaff',
    weight      = 180,
    price       = 7000,
    tier        = 'advanced',
    description = 'Chinese active-radar BVR — J-10C, J-11, JF-17',
}

AWConfigData.weapon['pl15'] = {
    display     = 'PL-15',
    type        = 'aim_radar',
    damage      = 450,
    range       = 20000,
    speed       = 1500,
    ammo        = 2,
    lock_time   = 3.0,
    lock_cone   = 22,
    lock_range  = 20000,
    guidance    = 'radar',
    counterable = 'chaff',
    weight      = 210,
    price       = 16000,
    tier        = 'elite',
    description = 'Chinese long-range — AESA dual-pulse, J-20 primary',
}

-- ============================================================
-- AIR-TO-GROUND: GUIDED MISSILES (AGM)
-- ============================================================

AWConfigData.weapon['agm65_maverick'] = {
    display     = 'AGM-65 Maverick',
    type        = 'agm',
    damage      = 500,
    range       = 8000,
    speed       = 315,
    ammo        = 2,
    lock_time   = 3.0,
    lock_cone   = 20,
    lock_range  = 8000,
    splash      = 5.0,
    guidance    = 'ir',
    counterable = 'flare',
    weight      = 210,
    price       = 6000,
    tier        = 'advanced',
    description = 'Standard anti-armor — A-10, F-16, F/A-18',
}

AWConfigData.weapon['agm114_hellfire'] = {
    display     = 'AGM-114 Hellfire',
    type        = 'agm',
    damage      = 400,
    range       = 6000,
    speed       = 425,
    ammo        = 4,
    lock_time   = 2.5,
    lock_cone   = 15,
    lock_range  = 6000,
    splash      = 3.0,
    guidance    = 'laser',
    counterable = 'none',
    weight      = 49,
    price       = 5000,
    tier        = 'advanced',
    description = 'Precision anti-tank — MQ-9, Apache, drones',
}

AWConfigData.weapon['agm88_harm'] = {
    display     = 'AGM-88 HARM',
    type        = 'agm',
    damage      = 350,
    range       = 15000,
    speed       = 660,
    ammo        = 2,
    lock_time   = 2.0,
    lock_cone   = 30,
    lock_range  = 15000,
    splash      = 4.0,
    guidance    = 'radar',
    counterable = 'ecm',
    weight      = 360,
    price       = 10000,
    tier        = 'elite',
    description = 'Anti-radiation missile — homes on enemy radar emissions',
}

AWConfigData.weapon['kh29'] = {
    display     = 'Kh-29 Kedge',
    type        = 'agm',
    damage      = 550,
    range       = 10000,
    speed       = 280,
    ammo        = 2,
    lock_time   = 3.5,
    lock_cone   = 18,
    lock_range  = 10000,
    splash      = 6.0,
    guidance    = 'laser',
    counterable = 'none',
    weight      = 657,
    price       = 7000,
    tier        = 'advanced',
    description = 'Russian tactical AGM — heavy warhead, Su-24/34',
}

AWConfigData.weapon['kh31'] = {
    display     = 'Kh-31P Anti-Radar',
    type        = 'agm',
    damage      = 380,
    range       = 18000,
    speed       = 750,
    ammo        = 1,
    lock_time   = 1.8,
    lock_cone   = 25,
    lock_range  = 18000,
    splash      = 5.0,
    guidance    = 'radar',
    counterable = 'ecm',
    weight      = 610,
    price       = 12000,
    tier        = 'elite',
    description = 'Russian supersonic anti-radiation missile',
}

AWConfigData.weapon['brimstone'] = {
    display     = 'Brimstone 2',
    type        = 'agm',
    damage      = 350,
    range       = 7000,
    speed       = 400,
    ammo        = 3,
    lock_time   = 1.5,
    lock_cone   = 25,
    lock_range  = 7000,
    splash      = 3.0,
    guidance    = 'radar',
    counterable = 'chaff',
    weight      = 50,
    price       = 8000,
    tier        = 'advanced',
    description = 'British millimetric radar — fire-and-forget salvo',
}

AWConfigData.weapon['agm158_jassm'] = {
    display     = 'AGM-158 JASSM',
    type        = 'agm',
    damage      = 800,
    range       = 30000,
    speed       = 280,
    ammo        = 1,
    lock_time   = 0.0,
    lock_cone   = 0,
    lock_range  = 0,
    splash      = 8.0,
    guidance    = 'gps',
    counterable = 'none',
    weight      = 975,
    price       = 20000,
    tier        = 'elite',
    description = 'Stealth cruise missile — pre-programmed GPS target, massive damage',
}

AWConfigData.weapon['scalp_eg'] = {
    display     = 'SCALP-EG / Storm Shadow',
    type        = 'agm',
    damage      = 750,
    range       = 25000,
    speed       = 300,
    ammo        = 1,
    lock_time   = 0.0,
    lock_cone   = 0,
    lock_range  = 0,
    splash      = 7.0,
    guidance    = 'gps',
    counterable = 'none',
    weight      = 1300,
    price       = 18000,
    tier        = 'elite',
    description = 'Anglo-French stealth cruise missile — bunker buster',
}

-- ============================================================
-- SCI-FI MISSILES
-- ============================================================

AWConfigData.weapon['proton_torpedo'] = {
    display     = 'Proton Torpedo',
    type        = 'aim_ir',
    damage      = 600,
    range       = 8000,
    speed       = 1200,
    ammo        = 4,
    lock_time   = 1.0,
    lock_cone   = 45,
    lock_range  = 8000,
    guidance    = 'ir',
    counterable = 'ecm',
    weight      = 0,
    price       = 10000,
    tier        = 'special',
    description = 'Energy torpedo — X-Wing, Arwing',
}

AWConfigData.weapon['concussion_missile'] = {
    display     = 'Concussion Missile',
    type        = 'aim_radar',
    damage      = 500,
    range       = 10000,
    speed       = 1400,
    ammo        = 6,
    lock_time   = 1.5,
    lock_cone   = 30,
    lock_range  = 10000,
    guidance    = 'radar',
    counterable = 'ecm',
    weight      = 0,
    price       = 8000,
    tier        = 'special',
    description = 'Imperial/Rebel standard ordnance',
}
