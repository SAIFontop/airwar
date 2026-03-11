--[[
    aw-config — AIRWAR Configuration Resource
    Loads all type definitions, validates schemas, registers into CoreRegistry.
    This is the data backbone: aircraft, weapons, factions, zones, ranks, economy, etc.
]]

fx_version 'cerulean'
game 'gta5'
lua54 'yes'

author 'AIRWAR'
description 'AIRWAR — Configuration Loader & Type Registry'
version '1.0.0'

dependency 'aw-core'

-- Schema definitions (loaded first)
shared_scripts {
    '@aw-core/shared/constants.lua',
    '@aw-core/shared/utils.lua',
    'schema/*.lua',
}

-- Data files (aircraft, weapons, factions, world, etc.)
server_scripts {
    'data/server.lua',
    'data/aircraft/fighters.lua',
    'data/aircraft/bombers.lua',
    'data/aircraft/multirole.lua',
    'data/aircraft/support.lua',
    'data/aircraft/transport.lua',
    'data/aircraft/special.lua',
    'data/weapons/guns.lua',
    'data/weapons/missiles.lua',
    'data/weapons/bombs.lua',
    'data/loadouts/presets.lua',
    'data/factions/factions.lua',
    'data/world/zones.lua',
    'data/world/bases.lua',
    'data/missions/templates.lua',
    'data/ranks/ranks.lua',
    'data/economy/economy.lua',
    'data/permissions/defaults.lua',
    'server.lua',
}

client_scripts {
    'client.lua',
}

-- Exports
exports {
    'GetConfig',
    'GetConfigValue',
    'ReloadConfig',
}
