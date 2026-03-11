--[[
    aw-config — Weapon Data: Guns
    Autocannons and rotary cannons for aircraft gun pods.
    Fields match AWConfigSchemas.weapon.
]]

AWConfigData = AWConfigData or {}
AWConfigData.weapon = AWConfigData.weapon or {}

-- ============================================================
-- ROTARY / GATLING CANNONS
-- ============================================================

AWConfigData.weapon['m61_vulcan'] = {
    display     = 'M61A1 Vulcan',
    type        = 'gun',
    damage      = 45,
    range       = 2000,
    speed       = 1050,
    ammo        = 510,
    fire_rate   = 100, -- rounds/sec (6000 rpm)
    guidance    = 'none',
    counterable = 'none',
    weight      = 112,
    price       = 0,
    tier        = 'basic',
    description = 'Standard 20mm rotary cannon — F-14, F-15, F-16, F/A-18',
}

AWConfigData.weapon['m61a2'] = {
    display     = 'M61A2 Vulcan',
    type        = 'gun',
    damage      = 50,
    range       = 2200,
    speed       = 1050,
    ammo        = 480,
    fire_rate   = 100,
    guidance    = 'none',
    counterable = 'none',
    weight      = 92,
    price       = 2000,
    tier        = 'advanced',
    description = 'Lightweight Vulcan — F-22 Raptor standard gun',
}

AWConfigData.weapon['gau8_avenger'] = {
    display     = 'GAU-8/A Avenger',
    type        = 'gun',
    damage      = 120,
    range       = 3500,
    speed       = 1070,
    ammo        = 1174,
    fire_rate   = 65, -- 3900 rpm
    guidance    = 'none',
    counterable = 'none',
    weight      = 281,
    price       = 5000,
    tier        = 'advanced',
    description = '30mm monster — A-10 Thunderbolt II depleted uranium rounds',
}

AWConfigData.weapon['gau12_equalizer'] = {
    display     = 'GAU-12 Equalizer',
    type        = 'gun',
    damage      = 60,
    range       = 2500,
    speed       = 1040,
    ammo        = 300,
    fire_rate   = 60, -- 3600 rpm
    guidance    = 'none',
    counterable = 'none',
    weight      = 122,
    price       = 3000,
    tier        = 'advanced',
    description = '25mm rotary — AV-8B Harrier, AC-130 starboard',
}

-- ============================================================
-- AUTOCANNONS (SINGLE/TWIN BARREL)
-- ============================================================

AWConfigData.weapon['gsh30_1'] = {
    display     = 'GSh-30-1',
    type        = 'gun',
    damage      = 65,
    range       = 1800,
    speed       = 900,
    ammo        = 150,
    fire_rate   = 25, -- 1500 rpm
    guidance    = 'none',
    counterable = 'none',
    weight      = 46,
    price       = 0,
    tier        = 'basic',
    description = 'Russian 30mm single-barrel cannon — MiG-29, Su-27 family',
}

AWConfigData.weapon['gsh30_2'] = {
    display     = 'GSh-30-2',
    type        = 'gun',
    damage      = 70,
    range       = 2000,
    speed       = 900,
    ammo        = 250,
    fire_rate   = 50, -- 3000 rpm twin
    guidance    = 'none',
    counterable = 'none',
    weight      = 105,
    price       = 1000,
    tier        = 'basic',
    description = 'Twin-barrel 30mm — Su-25, Mi-24 Hind',
}

AWConfigData.weapon['gsh23'] = {
    display     = 'GSh-23L',
    type        = 'gun',
    damage      = 40,
    range       = 1500,
    speed       = 850,
    ammo        = 200,
    fire_rate   = 55, -- 3400 rpm
    guidance    = 'none',
    counterable = 'none',
    weight      = 50,
    price       = 0,
    tier        = 'basic',
    description = '23mm twin-barrel — MiG-21, MiG-23, Su-24',
}

AWConfigData.weapon['defa_554'] = {
    display     = 'DEFA 554',
    type        = 'gun',
    damage      = 55,
    range       = 1600,
    speed       = 820,
    ammo        = 125,
    fire_rate   = 22, -- 1300 rpm
    guidance    = 'none',
    counterable = 'none',
    weight      = 85,
    price       = 0,
    tier        = 'basic',
    description = '30mm revolver cannon — Mirage, Rafale',
}

AWConfigData.weapon['aden_25'] = {
    display     = 'Mauser BK-27',
    type        = 'gun',
    damage      = 58,
    range       = 1800,
    speed       = 1025,
    ammo        = 150,
    fire_rate   = 28, -- 1700 rpm
    guidance    = 'none',
    counterable = 'none',
    weight      = 100,
    price       = 500,
    tier        = 'basic',
    description = '27mm revolver cannon — Eurofighter, Tornado, Gripen',
}

AWConfigData.weapon['browning_m3'] = {
    display     = 'Browning M3',
    type        = 'gun',
    damage      = 30,
    range       = 1200,
    speed       = 890,
    ammo        = 400,
    fire_rate   = 20, -- 1200 rpm
    guidance    = 'none',
    counterable = 'none',
    weight      = 29,
    price       = 0,
    tier        = 'basic',
    description = '.50 cal heavy machine gun — WWII fighters, light aircraft',
}

AWConfigData.weapon['type23_1'] = {
    display     = 'Type 23-1',
    type        = 'gun',
    damage      = 42,
    range       = 1500,
    speed       = 860,
    ammo        = 200,
    fire_rate   = 20,
    guidance    = 'none',
    counterable = 'none',
    weight      = 60,
    price       = 0,
    tier        = 'basic',
    description = '23mm cannon — Chinese J-10, J-11, JF-17',
}

AWConfigData.weapon['gau22'] = {
    display     = 'GAU-22/A',
    type        = 'gun',
    damage      = 55,
    range       = 2500,
    speed       = 1050,
    ammo        = 220,
    fire_rate   = 55, -- 3300 rpm
    guidance    = 'none',
    counterable = 'none',
    weight      = 100,
    price       = 4000,
    tier        = 'advanced',
    description = '25mm rotary — F-35 Lightning II',
}

-- ============================================================
-- GUNPODS / EXTERNAL GUN MOUNTS
-- ============================================================

AWConfigData.weapon['gpu5'] = {
    display     = 'GPU-5/A',
    type        = 'gun',
    damage      = 70,
    range       = 2000,
    speed       = 1050,
    ammo        = 353,
    fire_rate   = 38, -- 2250 rpm
    guidance    = 'none',
    counterable = 'none',
    weight      = 825,
    price       = 3000,
    tier        = 'advanced',
    description = '30mm gun pod — can be mounted on any hardpoint',
}

AWConfigData.weapon['sppu22'] = {
    display     = 'SPPU-22',
    type        = 'gun',
    damage      = 42,
    range       = 1800,
    speed       = 850,
    ammo        = 260,
    fire_rate   = 50,
    guidance    = 'none',
    counterable = 'none',
    weight      = 125,
    price       = 2000,
    tier        = 'basic',
    description = '23mm gun pod — flexible mount, Su-24/MiG-27',
}

-- ============================================================
-- ENERGY WEAPONS (SCI-FI)
-- ============================================================

AWConfigData.weapon['plasma_cannon'] = {
    display     = 'Plasma Cannon',
    type        = 'gun',
    damage      = 80,
    range       = 3000,
    speed       = 1500,
    ammo        = 999,
    fire_rate   = 15,
    guidance    = 'none',
    counterable = 'none',
    weight      = 0,
    price       = 15000,
    tier        = 'special',
    description = 'Energy-based weapon — sci-fi fighters only',
}

AWConfigData.weapon['laser_blaster'] = {
    display     = 'Twin Laser Blaster',
    type        = 'gun',
    damage      = 60,
    range       = 4000,
    speed       = 9999,
    ammo        = 999,
    fire_rate   = 20,
    guidance    = 'none',
    counterable = 'none',
    weight      = 0,
    price       = 12000,
    tier        = 'special',
    description = 'Imperial/Rebel style laser — instant hit',
}

-- ============================================================
-- AC-130 ARSENAL
-- ============================================================

AWConfigData.weapon['l60_bofors'] = {
    display     = 'L60 Bofors 40mm',
    type        = 'gun',
    damage      = 85,
    range       = 3000,
    speed       = 870,
    ammo        = 256,
    fire_rate   = 2,  -- 120 rpm
    guidance    = 'none',
    counterable = 'none',
    weight      = 500,
    price       = 4000,
    tier        = 'advanced',
    description = '40mm auto-cannon — AC-130 secondary weapon',
}

AWConfigData.weapon['m102_howitzer'] = {
    display     = 'M102 105mm Howitzer',
    type        = 'gun',
    damage      = 250,
    range       = 5000,
    speed       = 500,
    ammo        = 100,
    fire_rate   = 0.17, -- 10 rpm
    splash      = 15.0,
    guidance    = 'none',
    counterable = 'none',
    weight      = 1500,
    price       = 8000,
    tier        = 'elite',
    description = '105mm howitzer — AC-130 primary, devastating area damage',
}
