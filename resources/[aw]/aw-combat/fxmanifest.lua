fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'aw-combat'
description 'AIRWAR — Combat, Damage & Kill Attribution'
author 'AIRWAR Framework'
version '1.0.0'

dependencies {
    'aw-core',
    'aw-config',
    'aw-aircraft',
    'aw-loadout',
    'aw-faction',
}

server_scripts {
    '@aw-core/shared/constants.lua',
    '@aw-core/shared/utils.lua',
    'server.lua',
}

client_scripts {
    '@aw-core/shared/constants.lua',
    '@aw-core/shared/utils.lua',
    'client.lua',
}

provides {
    'GetDamageSources',
    'GetKillFeed',
    'ProcessHit',
}
