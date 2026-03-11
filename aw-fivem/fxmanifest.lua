fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'aw-fivem'
description 'AW Core Framework'
author 'AIRWAR'
version '2.0.0'

shared_scripts {
    'shared/constants.lua',
    'shared/utils.lua',
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'server/main.lua',
    'server/logger.lua',
    'server/error.lua',
    'server/config.lua',
    'server/database.lua',
    'server/cache.lua',
    'server/scheduler.lua',
    'server/events.lua',
    'server/state.lua',
    'server/security.lua',
    'server/network.lua',
    'server/callbacks.lua',
    'server/player.lua',
    'server/permissions.lua',
    'server/commands.lua',
    'server/entity.lua',
    'server/modules.lua',
    'server/metrics.lua',
    'server/boot.lua',
}

client_scripts {
    'client/main.lua',
    'client/events.lua',
    'client/state.lua',
    'client/network.lua',
    'client/callbacks.lua',
    'client/entity.lua',
    'client/ui.lua',
    'client/boot.lua',
}

ui_page 'html/index.html'

files {
    'html/**',
}
