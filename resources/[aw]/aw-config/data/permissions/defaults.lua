--[[
    aw-config — Default Permissions
    Maps rank tiers and special roles to permission nodes.
    Used by CorePermissions to initialize default ACL.
]]

AWConfigData = AWConfigData or {}
AWConfigData.permissions = AWConfigData.permissions or {}

-- ============================================================
-- TIER-BASED DEFAULT PERMISSIONS
-- Ranks in this tier automatically receive these permissions.
-- Higher tiers inherit ALL permissions from lower tiers.
-- ============================================================

AWConfigData.permissions.tier_defaults = {
    -- Tier 1: Recruit / Airman
    [1] = {
        'player.spawn',
        'player.chat',
        'aircraft.spawn_trainer',
        'store.browse',
        'store.buy_tier1',
    },

    -- Tier 2: A1C / Corporal / Sergeant
    [2] = {
        'aircraft.spawn_fighter_basic',
        'aircraft.spawn_bomber_basic',
        'aircraft.spawn_transport_basic',
        'aircraft.spawn_attacker_basic',
        'aircraft.spawn_recon_basic',
        'loadout.customize',
        'loadout.preset_save',
        'mission.join',
        'chat.faction',
        'store.buy_tier2',
    },

    -- Tier 3: SSgt / TSgt / MSgt
    [3] = {
        'aircraft.spawn_multirole',
        'aircraft.spawn_interceptor_basic',
        'aircraft.spawn_fighter_advanced',
        'aircraft.spawn_bomber_advanced',
        'aircraft.spawn_awacs',
        'weapon.guided_bombs',
        'weapon.bvr_missiles',
        'weapon.agm_missiles',
        'mission.create_basic',
        'squadron.join',
        'squadron.create',
        'store.buy_tier3',
    },

    -- Tier 4: WO / 2Lt / 1Lt
    [4] = {
        'aircraft.spawn_stealth_basic',
        'aircraft.spawn_stealth_advanced',
        'aircraft.spawn_gunship',
        'aircraft.spawn_tanker',
        'aircraft.spawn_all_conventional',
        'weapon.cluster_bombs',
        'weapon.all_conventional',
        'mission.create_advanced',
        'mission.create_any',
        'faction.vote',
        'store.buy_tier4',
        'store.discount_5',
        'store.discount_10',
    },

    -- Tier 5: Captain / Major / Colonel
    [5] = {
        'aircraft.spawn_special_basic',
        'aircraft.spawn_special_advanced',
        'squadron.lead',
        'squadron.manage_any',
        'faction.officer',
        'faction.promote',
        'faction.manage',
        'war.start_vote',
        'war.command',
        'store.buy_tier5',
        'store.discount_15',
        'store.discount_20',
    },

    -- Tier 6: General / Marshal
    [6] = {
        'aircraft.spawn_all',
        'aircraft.spawn_legendary',
        'weapon.all',
        'faction.leader',
        'war.declare',
        'war.strategy',
        'admin.view_stats',
        'admin.moderate',
        'admin.full',
        'store.buy_any',
        'store.discount_25',
    },
}

-- ============================================================
-- SPECIAL ROLE PERMISSIONS
-- Assigned independently of rank.
-- ============================================================

AWConfigData.permissions.roles = {
    -- Server admin (ace-based, not rank-based)
    admin = {
        'admin.full',
        'admin.moderate',
        'admin.view_stats',
        'admin.ban',
        'admin.kick',
        'admin.teleport',
        'admin.spawn_any',
        'admin.reload_config',
        'admin.manage_economy',
        'admin.manage_factions',
        'admin.bypass_cooldown',
        'admin.god_mode',
    },

    -- Moderator
    moderator = {
        'admin.moderate',
        'admin.view_stats',
        'admin.kick',
        'admin.teleport',
        'admin.spawn_any',
    },

    -- Faction leader (stacks with tier perms)
    faction_leader = {
        'faction.leader',
        'faction.manage',
        'faction.promote',
        'faction.demote',
        'faction.kick_member',
        'faction.set_motd',
        'faction.manage_roster',
        'war.declare',
        'war.command',
        'war.strategy',
    },

    -- Faction officer
    faction_officer = {
        'faction.officer',
        'faction.promote',
        'faction.set_motd',
        'war.start_vote',
        'war.command',
    },

    -- Squadron leader
    squadron_leader = {
        'squadron.lead',
        'squadron.invite',
        'squadron.kick',
        'squadron.set_waypoint',
        'squadron.set_formation',
    },

    -- VIP / Donator
    vip = {
        'store.discount_10',
        'aircraft.spawn_special_basic',
        'player.custom_title',
        'player.priority_queue',
        'loadout.extra_slots',
    },
}

-- ============================================================
-- DEFAULT DENIALS
-- Permissions explicitly denied for everyone unless overridden.
-- ============================================================

AWConfigData.permissions.denied_by_default = {
    'admin.full',
    'admin.ban',
    'admin.kick',
    'admin.teleport',
    'admin.spawn_any',
    'admin.reload_config',
    'admin.manage_economy',
    'admin.manage_factions',
    'admin.bypass_cooldown',
    'admin.god_mode',
    'player.custom_title',
    'player.priority_queue',
}
