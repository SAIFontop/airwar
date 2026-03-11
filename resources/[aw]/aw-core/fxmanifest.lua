fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'aw-core'
description 'AIRWAR Core Framework — The operating system of the server'
author 'AIRWAR'
version '1.0.0'

-- Shared files (loaded before server and client)
shared_scripts {
    'shared/constants.lua',
    'shared/contracts.lua',
    'shared/utils.lua',
}

-- Server-side scripts
server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'server/systems/logger.lua',
    'server/systems/validator.lua',
    'server/systems/scheduler.lua',
    'server/systems/middleware.lua',
    'server/systems/database.lua',
    'server/systems/cache.lua',
    'server/systems/identity.lua',
    'server/systems/state.lua',
    'server/systems/events.lua',
    'server/systems/callbacks.lua',
    'server/systems/permissions.lua',
    'server/systems/registry.lua',
    'server/systems/commands.lua',
    'server/systems/api.lua',
    'server/systems/lifecycle.lua',
    'server/handlers/player_connect.lua',
    'server/handlers/player_drop.lua',
    'server/handlers/resource_stop.lua',
    'server/http/router.lua',
    'server/http/auth.lua',
    'server/http/routes/players.lua',
    'server/http/routes/aircraft.lua',
    'server/http/routes/factions.lua',
    'server/http/routes/world.lua',
    'server/http/routes/missions.lua',
    'server/http/routes/admin.lua',
    'server/http/routes/server.lua',
    'server/boot.lua',
}

-- Client-side scripts
client_scripts {
    'client/systems/callbacks.lua',
    'client/systems/state.lua',
    'client/systems/events.lua',
    'client/boot.lua',
}

-- Dependencies
dependencies {
    'oxmysql',
}

-- Exports (Core API surface)
exports {
    -- Module registration
    'RegisterModule',
    'GetModuleState',

    -- Player API
    'GetPlayer',
    'GetPlayerByServerId',
    'GetAllPlayers',
    'GetPlayerCount',

    -- State
    'GetState',
    'SetState',

    -- Events
    'EmitEvent',
    'OnEvent',

    -- Module router
    'CallModule',

    -- Registry
    'RegisterType',
    'GetType',
    'GetAllTypes',

    -- Cache
    'CacheGet',
    'CacheSet',
    'CacheInvalidate',

    -- Permissions
    'HasPermission',
    'AddPermission',
    'RemovePermission',

    -- Scheduler
    'ScheduleOnce',
    'ScheduleRepeat',
    'CancelSchedule',

    -- Callbacks
    'RegisterCallback',

    -- Commands
    'RegisterCommand',

    -- Data
    'DataFind',
    'DataFindAll',
    'DataInsert',
    'DataUpdate',
    'DataDelete',
    'DataIncrement',

    -- UI
    'UISetState',
    'UINotify',

    -- Log
    'LogInfo',
    'LogWarn',
    'LogError',
    'LogDebug',

    -- Validator
    'Validate',

    -- HTTP
    'RegisterRoute',

    -- Utility
    'GenerateId',

    -- Lifecycle
    'IsReady',
    'GetCoreAPI',
    'GetAWID',
}
