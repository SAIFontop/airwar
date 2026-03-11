fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'aw-fivem'
description 'AW Core Framework'
author 'AIRWAR'
version '2.0.0'

shared_scripts {
    'core/utils/constants.lua',
    'core/utils/shared.lua',
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'core/bootstrap/shared.lua',
    'core/logging/logger.lua',
    'core/logging/error.lua',
    'core/config/server.lua',
    'core/database/server.lua',
    'core/cache/server.lua',
    'core/timers/server.lua',
    'core/events/server.lua',
    'core/state/server.lua',
    'core/security/server.lua',
    'core/network/server.lua',
    'core/callbacks/server.lua',
    'core/player/server.lua',
    'core/permissions/server.lua',
    'core/bootstrap/commands.lua',
    'core/entities/server.lua',
    'core/modules/server.lua',
    'core/metrics/server.lua',
    'core/bootstrap/server.lua',
}

client_scripts {
    'core/bootstrap/client_init.lua',
    'core/events/client.lua',
    'core/state/client.lua',
    'core/network/client.lua',
    'core/callbacks/client.lua',
    'core/entities/client.lua',
    'core/ui/bridge.lua',
    'core/bootstrap/client.lua',
}

ui_page 'html/index.html'

files {
    'html/**',
}
