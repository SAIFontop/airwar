--[[
    AIRWAR Core - Module Contracts
    CONTRACT_VERSION per module for API compatibility checking
]]

AW_CONTRACTS = {
    ['core']       = { version = 1, api = { 'Players', 'State', 'Data', 'Events', 'Modules', 'Permissions', 'Registry', 'Cache', 'Scheduler', 'Callbacks', 'Commands', 'UI', 'Log', 'Validator', 'Http' } },
    ['config']     = { version = 1, api = { 'Get', 'GetAll', 'GetCategory', 'Validate' } },
    ['aircraft']   = { version = 1, api = { 'Spawn', 'Despawn', 'GetState', 'SetDamage', 'UpdateFuel', 'GetByPilot', 'GetAll' } },
    ['faction']    = { version = 1, api = { 'Assign', 'GetFaction', 'GetMembers', 'GetScores', 'AddScore' } },
    ['world']      = { version = 1, api = { 'GetZones', 'GetZoneState', 'CaptureZone', 'GetBases', 'GetBaseState' } },
    ['loadout']    = { version = 1, api = { 'Equip', 'GetLoadout', 'ValidateLoadout', 'GetAvailableWeapons' } },
    ['combat']     = { version = 1, api = { 'ProcessHit', 'RegisterKill', 'GetDamageLog', 'ValidateShot' } },
    ['targeting']  = { version = 1, api = { 'GetContacts', 'RequestLock', 'ReleaseLock', 'GetRWRThreats' } },
    ['mission']    = { version = 1, api = { 'Create', 'GetActive', 'UpdateObjective', 'Complete', 'Fail' } },
    ['war']        = { version = 1, api = { 'GetPhase', 'GetState', 'CheckVictory', 'Reset' } },
    ['store']      = { version = 1, api = { 'GetBalance', 'AddMoney', 'RemoveMoney', 'Purchase', 'GetPrices' } },
    ['squadron']   = { version = 1, api = { 'Create', 'Join', 'Leave', 'Disband', 'GetMembers', 'GetSquadron' } },
    ['respawn']    = { version = 1, api = { 'StartTimer', 'GetTimer', 'Respawn', 'EnterSpectate', 'ExitSpectate' } },
    ['hud']        = { version = 1, api = { 'PushState', 'TogglePanel', 'SendNotification' } },
    ['admin']      = { version = 1, api = { 'Execute', 'GetDebugInfo', 'Spectate' } },
    ['log']        = { version = 1, api = { 'Info', 'Warn', 'Error', 'Debug', 'Discord' } },
}

return AW_CONTRACTS
