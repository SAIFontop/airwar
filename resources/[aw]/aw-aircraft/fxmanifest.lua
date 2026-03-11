--[[
    aw-aircraft — AIRWAR Aircraft Module
    Aircraft spawning, ownership, fuel management, flight augmentation, damage zones.
    Tier 2 — depends on aw-core, aw-config.
]]

fx_version 'cerulean'
game 'gta5'
lua54 'yes'

author 'AIRWAR'
description 'AIRWAR — Aircraft Spawning, Fuel, Flight Physics & Damage Zones'
version '1.0.0'

dependencies {
    'aw-core',
    'aw-config',
}

shared_scripts {
    '@aw-core/shared/constants.lua',
    '@aw-core/shared/utils.lua',
}

server_scripts {
    'server.lua',
}

client_scripts {
    'client.lua',
}

exports {
    -- Server exports
    'SpawnAircraft',
    'DespawnAircraft',
    'GetAircraft',
    'GetPlayerAircraft',
    'GetAllAircraft',
    'IsOwned',
    'GrantOwnership',
    'RevokeOwnership',
    'GetOwnedAircraft',
    'DamageZone',
    'RepairAircraft',
    'RefuelAircraft',
}
