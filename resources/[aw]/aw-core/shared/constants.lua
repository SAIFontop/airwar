--[[
    AIRWAR Core - Shared Constants
    All event names, prefixes, enums used across the framework
]]

AW = AW or {}

-- ============================================================
-- ID PREFIXES
-- ============================================================
AW.PREFIX = {
    PLAYER   = 'AW-P-',   -- Permanent player ID
    SESSION  = 'AW-S-',   -- Per-connection session ID
    ENTITY   = 'AW-E-',   -- Runtime aircraft entity ID
    MODULE   = 'AW-M-',   -- Module registration ID
    MISSION  = 'AW-X-',   -- Mission instance ID
    FACTION  = 'AW-F-',   -- Faction ID
}

-- ============================================================
-- CORE EVENTS (server internal)
-- ============================================================
AW.EVENT = {
    -- Core lifecycle
    CORE_READY              = 'aw:core:ready',
    CORE_SHUTDOWN           = 'aw:core:shutdown',
    MODULE_REGISTERED       = 'aw:core:module:registered',
    MODULE_READY            = 'aw:core:module:ready',

    -- Player lifecycle
    PLAYER_CONNECTING       = 'aw:player:connecting',
    PLAYER_JOINED           = 'aw:player:joined',
    PLAYER_LOADED           = 'aw:player:loaded',
    PLAYER_SPAWNED          = 'aw:player:spawned',
    PLAYER_DROPPED          = 'aw:player:dropped',
    PLAYER_BANNED           = 'aw:player:banned',

    -- Aircraft
    AIRCRAFT_SPAWNED        = 'aw:aircraft:spawned',
    AIRCRAFT_ENTERED        = 'aw:aircraft:entered',
    AIRCRAFT_EXITED         = 'aw:aircraft:exited',
    AIRCRAFT_DESTROYED      = 'aw:aircraft:destroyed',
    AIRCRAFT_DESPAWNED      = 'aw:aircraft:despawned',
    AIRCRAFT_DAMAGED        = 'aw:aircraft:damaged',

    -- Combat
    WEAPON_FIRED            = 'aw:combat:fired',
    WEAPON_HIT              = 'aw:combat:hit',
    COMBAT_HIT              = 'aw:combat:hit',
    COMBAT_ASSIST           = 'aw:combat:assist',
    LOCK_ACQUIRED           = 'aw:combat:lock:acquired',
    LOCK_LOST               = 'aw:combat:lock:lost',
    LOCK_INITIATED          = 'aw:combat:lock:initiated',
    LOCK_BROKEN             = 'aw:combat:lock:broken',
    KILL                    = 'aw:combat:kill',
    ASSIST                  = 'aw:combat:assist',
    FRIENDLY_FIRE           = 'aw:combat:friendly_fire',
    CM_DEPLOYED             = 'aw:combat:cm:deployed',
    COUNTERMEASURE_DEPLOYED = 'aw:combat:cm:deployed',
    COUNTERMEASURE_RESOLVED = 'aw:combat:cm:resolved',

    -- Targeting / Radar
    RADAR_CONTACT           = 'aw:radar:contact',
    RADAR_LOST              = 'aw:radar:lost',
    RWR_WARNING             = 'aw:rwr:warning',
    RWR_LOCK                = 'aw:rwr:lock',

    -- Faction
    FACTION_SCORE_CHANGED   = 'aw:faction:score',
    FACTION_ASSIGNED        = 'aw:faction:assigned',

    -- World / Zones
    ZONE_CAPTURED           = 'aw:zone:captured',
    ZONE_CONTESTED          = 'aw:zone:contested',
    ZONE_NEUTRALIZED        = 'aw:zone:neutralized',
    ZONE_LOST               = 'aw:zone:lost',
    BASE_DESTROYED          = 'aw:zone:base:destroyed',
    BASE_REPAIRED           = 'aw:zone:base:repaired',
    WEATHER_CHANGED         = 'aw:world:weather:changed',

    -- Supply
    SUPPLY_CONNECTED        = 'aw:supply:connected',
    SUPPLY_DISCONNECTED     = 'aw:supply:disconnected',

    -- Mission
    MISSION_STARTED         = 'aw:mission:started',
    MISSION_AVAILABLE       = 'aw:mission:available',
    MISSION_OBJECTIVE       = 'aw:mission:objective',
    MISSION_OBJECTIVE_COMPLETED = 'aw:mission:objective:completed',
    MISSION_COMPLETED       = 'aw:mission:completed',
    MISSION_FAILED          = 'aw:mission:failed',

    -- War
    WAR_PHASE_CHANGED       = 'aw:war:phase',
    WAR_ENDED               = 'aw:war:ended',
    WAR_RESET               = 'aw:war:reset',

    -- Economy
    MONEY_EARNED            = 'aw:economy:earned',
    MONEY_SPENT             = 'aw:economy:spent',
    BALANCE_CHANGED         = 'aw:economy:balance:changed',
    ITEM_PURCHASED          = 'aw:economy:purchased',

    -- Respawn
    PLAYER_RESPAWNED        = 'aw:player:respawned',
    RESPAWN_TIMER_STARTED   = 'aw:respawn:timer:started',

    -- Squadron
    SQUADRON_CREATED        = 'aw:squadron:created',
    SQUADRON_DISBANDED      = 'aw:squadron:disbanded',
    SQUADRON_MEMBER_JOINED  = 'aw:squadron:member:joined',
    SQUADRON_MEMBER_LEFT    = 'aw:squadron:member:left',
    SQUADRON_ORDER_ISSUED   = 'aw:squadron:order:issued',

    -- Admin
    ADMIN_ACTION            = 'aw:admin:action',

    -- UI
    UI_UPDATE               = 'aw:ui:update',
    UI_ACTION               = 'aw:ui:action',
    UI_TOGGLE               = 'aw:ui:toggle',

    -- Callbacks (server↔client)
    CALLBACK_REQUEST        = 'aw:cb:req',
    CALLBACK_RESPONSE       = 'aw:cb:res',

    -- State sync
    STATE_SYNC              = 'aw:state:sync',
    STATE_BATCH             = 'aw:state:batch',
}

-- ============================================================
-- AIRCRAFT ROLES
-- ============================================================
AW.ROLE = {
    FIGHTER      = 'fighter',         -- Air superiority
    BOMBER       = 'bomber',          -- Ground attack / strategic bombing
    MULTIROLE    = 'multirole',       -- Fighter-bomber
    INTERCEPTOR  = 'interceptor',     -- Fast intercept
    ATTACKER     = 'attacker',        -- Close air support / ground attack
    RECON        = 'recon',           -- Reconnaissance / spy plane
    AWACS        = 'awacs',           -- Airborne early warning
    TANKER       = 'tanker',          -- Aerial refueling
    TRANSPORT    = 'transport',       -- Cargo / troop transport
    GUNSHIP      = 'gunship',        -- Heavy ground attack (AC-130)
    VTOL         = 'vtol',            -- Vertical takeoff
    DRONE        = 'drone',           -- Unmanned aerial vehicle
    TRAINER      = 'trainer',         -- Training aircraft
    STEALTH      = 'stealth',         -- Low-observable aircraft
}

-- ============================================================
-- WEAPON TYPES
-- ============================================================
AW.WEAPON_TYPE = {
    GUN          = 'gun',             -- Rotary cannon / autocannon
    AIM_IR       = 'aim_ir',          -- IR-guided air-to-air missile
    AIM_RADAR    = 'aim_radar',       -- Radar-guided air-to-air missile
    AGM          = 'agm',             -- Air-to-ground missile
    BOMB_DUMB    = 'bomb_dumb',       -- Unguided bomb
    BOMB_GUIDED  = 'bomb_guided',     -- Precision-guided munition
    ROCKET       = 'rocket',          -- Unguided rocket pod
    TORPEDO      = 'torpedo',         -- Anti-ship torpedo
}

-- ============================================================
-- COUNTERMEASURE TYPES
-- ============================================================
AW.CM_TYPE = {
    CHAFF        = 'chaff',           -- Radar countermeasure
    FLARE        = 'flare',           -- IR countermeasure
    ECM          = 'ecm',             -- Electronic countermeasure
}

-- ============================================================
-- DAMAGE ZONES (per aircraft)
-- ============================================================
AW.DAMAGE_ZONE = {
    FUSELAGE     = 'fuselage',
    LEFT_WING    = 'left_wing',
    RIGHT_WING   = 'right_wing',
    TAIL         = 'tail',
    ENGINE       = 'engine',
    COCKPIT      = 'cockpit',
    FUEL_TANK    = 'fuel_tank',
    AVIONICS     = 'avionics',
}

-- ============================================================
-- PLAYER STATES
-- ============================================================
AW.PLAYER_STATE = {
    CONNECTING   = 'connecting',
    LOADING      = 'loading',
    LOBBY        = 'lobby',           -- On ground, at base
    BRIEFING     = 'briefing',        -- Selecting aircraft/loadout
    SPAWNING     = 'spawning',        -- Aircraft being spawned
    FLYING       = 'flying',          -- In the air
    COMBAT       = 'combat',          -- Engaged in combat
    EJECTED      = 'ejected',         -- Parachuting
    DEAD         = 'dead',            -- Killed, waiting respawn
    SPECTATING   = 'spectating',      -- Spectator mode
}

-- ============================================================
-- PERMISSION NODES
-- ============================================================
AW.PERM = {
    -- Admin tiers
    ADMIN_FULL        = 'admin.full',
    ADMIN_MOD         = 'admin.moderate',
    ADMIN_SPECTATE    = 'admin.spectate',
    ADMIN_BAN         = 'admin.ban',
    ADMIN_KICK        = 'admin.kick',
    ADMIN_SPAWN       = 'admin.spawn',
    ADMIN_TELEPORT    = 'admin.teleport',
    ADMIN_GOD         = 'admin.god',
    ADMIN_WEATHER     = 'admin.weather',
    ADMIN_DEBUG       = 'admin.debug',

    -- Player
    PLAYER_FLY        = 'player.fly',
    PLAYER_CHAT       = 'player.chat',
    PLAYER_VOTE       = 'player.vote',
    PLAYER_SQUAD_CREATE = 'player.squad.create',

    -- Aircraft tiers
    AIRCRAFT_BASIC    = 'aircraft.basic',
    AIRCRAFT_ADVANCED = 'aircraft.advanced',
    AIRCRAFT_ELITE    = 'aircraft.elite',
    AIRCRAFT_SPECIAL  = 'aircraft.special',
}

-- ============================================================
-- DATABASE TABLE NAMES
-- ============================================================
AW.TABLE = {
    MIGRATIONS       = 'aw_migrations',
    PLAYERS          = 'aw_players',
    PLAYER_DATA      = 'aw_player_data',
    SESSIONS         = 'aw_sessions',
    STATS            = 'aw_stats',
    RANKINGS         = 'aw_rankings',
    AIRCRAFT         = 'aw_aircraft',
    OWNERSHIP        = 'aw_ownership',
    INVENTORY        = 'aw_inventory',
    FACTIONS_DATA    = 'aw_factions_data',
    BANS             = 'aw_bans',
    LOGS             = 'aw_logs',
    MISSIONS_HISTORY = 'aw_missions_history',
    WORLD_STATE      = 'aw_world_state',
    KILL_LOG         = 'aw_kill_log',
}

-- ============================================================
-- TICK RATES (Hz)
-- ============================================================
AW.TICK = {
    COMBAT       = 20,    -- Combat processing (50ms)
    FLIGHT       = 15,    -- Flight physics augmentation
    RADAR        = 8,     -- Radar sweep
    HUD_PUSH     = 15,    -- HUD data push to NUI
    RADAR_PUSH   = 8,     -- Radar display push to NUI
    DASHBOARD    = 2,     -- Dashboard info push
    WAR_MAP      = 1,     -- Strategic overlay push
    DB_FLUSH     = 0.033, -- Database write-behind (every 30s)
    LOG_FLUSH    = 0.1,   -- Log batch flush (every 10s)
    HEALTH_CHECK = 0.2,   -- Module health check (every 5s)
}

-- ============================================================
-- MISC CONSTANTS
-- ============================================================
AW.MAX_PLAYERS         = 32
AW.MAX_AIRCRAFT        = 64
AW.MAX_MISSILES_ACTIVE = 128
AW.FUEL_TICK_INTERVAL  = 1000   -- ms between fuel burn calculations
AW.LOCK_TIMEOUT        = 10000  -- ms before lock-on drops if not maintained
AW.RESPAWN_DEFAULT     = 15     -- seconds default respawn timer
AW.CALLSIGN_MAX_LEN   = 16
AW.CHAT_PREFIX         = '^3[AIRWAR]^0 '
AW.RESOURCE_PREFIX     = 'aw-'
AW.STATEBAG_PREFIX     = 'aw:'

-- ============================================================
-- FRAMEWORK VERSION
-- ============================================================
AW.VERSION = {
    MAJOR = 1,
    MINOR = 0,
    PATCH = 0,
    STRING = '1.0.0',
}
