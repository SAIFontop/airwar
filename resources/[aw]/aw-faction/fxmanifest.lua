--[[
    aw-faction — AIRWAR Faction Module
    Player assignment, balancing, faction state, roster management.
    Tier 2 — depends on aw-core, aw-config.
]]

fx_version 'cerulean'
game 'gta5'
lua54 'yes'

author 'AIRWAR'
description 'AIRWAR — Faction Assignment, Balancing & Roster Management'
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

exports {
    'GetFaction',
    'GetFactionMembers',
    'GetAllFactions',
    'AssignFaction',
    'LeaveFaction',
    'GetFactionScore',
    'AddFactionScore',
    'GetFactionOnlineCount',
}
