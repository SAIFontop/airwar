--[[
    aw-config — Faction Definitions
    Each faction is a team that players join.
    Fields match AWConfigSchemas.faction.
]]

AWConfigData = AWConfigData or {}
AWConfigData.faction = AWConfigData.faction or {}

-- ============================================================
-- MAIN FACTIONS (3 warring factions + 1 neutral)
-- ============================================================

AWConfigData.faction['eagles'] = {
    display     = 'Iron Eagles',
    color       = '#1E90FF',  -- Dodger Blue
    blip_color  = 3,          -- Blue (GTA blip colors)
    emblem      = 'eagle_crest',
    description = 'Western coalition air force — NATO doctrine, precision warfare',
    home_base   = 'base_lsia',
    aircraft    = {
        -- Fighters
        'f14', 'f15', 'f16', 'fa18', 'fab18', 'f22', 'yf23',
        -- Attackers
        'af10', 'aa10',
        -- Bombers
        'b25', 'ab29',
        -- Multirole
        'mdf4', 'afo', 'aft',
        -- Support
        'erieye', 'kc10', 'u2r', 'mq9', 'mq1',
        -- Gunship
        'ac130',
    },
    max_players = 32,
}

AWConfigData.faction['wolves'] = {
    display     = 'Grey Wolves',
    color       = '#DC143C',  -- Crimson Red
    blip_color  = 1,          -- Red
    emblem      = 'wolf_head',
    description = 'Eastern bloc air force — overwhelming force, heavy armor',
    home_base   = 'base_zancudo',
    aircraft    = {
        -- Fighters
        'mig29', 'mig21', 'mig15', 'su33', 'su30', 'sur30',
        -- Attackers
        'su25', 'su24',
        -- Bombers
        'su34',
        -- Multirole
        'ah29', 'au29',
        -- Support
        'kj2000',
        -- Transport
        'c130', 'ch130',
    },
    max_players = 32,
}

AWConfigData.faction['dragons'] = {
    display     = 'Storm Dragons',
    color       = '#FFD700',  -- Gold
    blip_color  = 46,         -- Yellow
    emblem      = 'dragon_wing',
    description = 'Pacific coalition — stealth tech, electronic warfare',
    home_base   = 'base_sandy',
    aircraft    = {
        -- Fighters
        'j10', 'jf17', 'j15a', 'j20', 'j31', 'j31b',
        -- Multirole
        'cj10', 'cj20',
        -- Support
        'e145d', 'e145f', 'dm3', 'dm5', 'dmnb', 'draf',
        -- Special
        'gripen', 'ef2000',
        -- Transport
        'e175', 'e190',
    },
    max_players = 32,
}

AWConfigData.faction['freelance'] = {
    display     = 'Freelancers',
    color       = '#808080',  -- Gray
    blip_color  = 4,          -- White
    emblem      = 'mercenary_wings',
    description = 'Independent mercenaries — access to all basic aircraft, no home base bonus',
    home_base   = nil,
    aircraft    = {
        -- Access to basic/trainer aircraft only
        'f5e', 'mig15', 'macchi', 'fokker', 'bf109', 'p47', 'p51',
        'sbesra', 'sstunt', 'an2', 'c208', 'icon5',
    },
    max_players = 16,
}
