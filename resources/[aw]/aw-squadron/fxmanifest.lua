fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'aw-squadron'
description 'AIRWAR — Squadron & Formation System'
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

provides {
    'CreateSquadron',
    'DisbandSquadron',
    'JoinSquadron',
    'LeaveSquadron',
    'GetSquadron',
    'GetPlayerSquadron',
    'SetFormation',
    'GetSquadronMembers',
}
