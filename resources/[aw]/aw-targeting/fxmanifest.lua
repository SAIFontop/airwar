fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'aw-targeting'
description 'AIRWAR — Radar, Targeting & Lock-on System'
author 'AIRWAR Framework'
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
    '@aw-core/shared/utils.lua',
    'server.lua',
}

client_scripts {
    '@aw-core/shared/constants.lua',
    '@aw-core/shared/utils.lua',
    'client.lua',
}

provides {
    'GetContacts',
    'RequestLock',
    'BreakLock',
    'GetLockState',
    'GetPlayerRadarRange',
}
