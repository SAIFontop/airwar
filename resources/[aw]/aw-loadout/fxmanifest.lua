fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'aw-loadout'
description 'AIRWAR — Loadout & Hardpoint Management'
author 'AIRWAR Framework'
version '1.0.0'

dependencies {
    'aw-core',
    'aw-config',
    'aw-aircraft',
    'aw-store',
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
    'GetLoadout',
    'SetLoadout',
    'GetHardpoints',
    'EquipWeapon',
    'UnequipWeapon',
    'GetAmmo',
    'ConsumeAmmo',
    'GetCountermeasures',
    'DeployCountermeasure',
}
