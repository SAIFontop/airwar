fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'aw-world'
description 'AIRWAR — World, Zones, Bases, Weather & Supply'
author 'AIRWAR Framework'
version '1.0.0'

dependencies {
    'aw-core',
    'aw-config',
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
    'GetZone',
    'GetAllZones',
    'GetZoneOwner',
    'CaptureZone',
    'GetBase',
    'GetAllBases',
    'IsBaseOperational',
    'GetWeather',
    'SetWeather',
    'GetSupplyStatus',
}
