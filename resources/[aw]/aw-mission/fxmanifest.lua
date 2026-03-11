fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'aw-mission'
description 'AIRWAR — Mission generation, objectives, scoring'
version '1.0.0'

dependencies {
    'aw-core',
    'aw-config',
    'aw-faction',
    'aw-world',
    'aw-store',
}

server_scripts {
    '@aw-core/shared/constants.lua',
    '@aw-core/shared/contracts.lua',
    '@aw-core/shared/utils.lua',
    'server.lua',
}

exports {
    'GetActiveMissions',
    'GetMission',
    'JoinMission',
    'LeaveMission',
    'GetPlayerMissions',
    'GenerateMission',
    'CompleteMission',
    'FailMission',
}
