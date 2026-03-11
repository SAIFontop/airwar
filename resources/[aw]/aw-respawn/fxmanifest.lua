fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'aw-respawn'
description 'AIRWAR — Respawn, death handling, aircraft reselection'
version '1.0.0'

dependencies {
    'aw-core',
    'aw-config',
    'aw-aircraft',
    'aw-faction',
    'aw-world',
}

server_scripts {
    '@aw-core/shared/constants.lua',
    '@aw-core/shared/contracts.lua',
    '@aw-core/shared/utils.lua',
    'server.lua',
}

client_scripts {
    '@aw-core/shared/constants.lua',
    '@aw-core/shared/contracts.lua',
    '@aw-core/shared/utils.lua',
    'client.lua',
}

exports {
    'GetRespawnTimer',
    'GetRespawnState',
    'GetAvailableBases',
    'ForceRespawn',
}
