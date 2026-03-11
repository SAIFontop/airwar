fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'aw-admin'
description 'AIRWAR — Administration & Debug Tools'
author 'AIRWAR'
version '1.0.0'

dependencies {
    'aw-core',
    'aw-config',
    'aw-faction',
    'aw-aircraft',
    'aw-world',
    'aw-war',
}

server_scripts {
    '@aw-core/shared/constants.lua',
    '@aw-core/shared/contracts.lua',
    '@aw-core/shared/utils.lua',
    'server.lua',
}

client_scripts {
    'client.lua',
}

provides {
    'aw-admin',
}

-- Exports:
-- Server: IsAdmin, GetAdminLevel, SpectatePlayer, ForceEndWar
