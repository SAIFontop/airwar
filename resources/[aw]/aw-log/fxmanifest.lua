--[[
    aw-log — AIRWAR Log & Telemetry Resource
    Structured logging, Discord webhooks, performance counters, match history.
    Tier 1 — depends only on aw-core.
]]

fx_version 'cerulean'
game 'gta5'
lua54 'yes'

author 'AIRWAR'
description 'AIRWAR — Structured Logging, Discord Webhooks & Performance Telemetry'
version '1.0.0'

dependency 'aw-core'

shared_scripts {
    '@aw-core/shared/constants.lua',
    '@aw-core/shared/utils.lua',
}

server_scripts {
    'server.lua',
}

-- Exports for other resources
exports {
    'LogEvent',
    'GetPerformanceStats',
    'GetMatchHistory',
}
