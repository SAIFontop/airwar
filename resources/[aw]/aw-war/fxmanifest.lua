fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'aw-war'
description 'AIRWAR — War phases, victory conditions, strategic state'
version '1.0.0'

dependencies {
    'aw-core',
    'aw-config',
    'aw-faction',
    'aw-world',
    'aw-mission',
}

server_scripts {
    '@aw-core/shared/constants.lua',
    '@aw-core/shared/contracts.lua',
    '@aw-core/shared/utils.lua',
    'server.lua',
}

exports {
    'GetWarState',
    'GetWarPhase',
    'GetWarScore',
    'SetWarPhase',
    'ResetWar',
    'GetTimeInPhase',
    'GetVictoryProgress',
}
