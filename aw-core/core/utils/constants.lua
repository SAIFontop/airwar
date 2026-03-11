AW = {
    VERSION = '2.0.0',
    NAME    = 'aw-core',
    PREFIX  = '^3[AW] ^0',

    RANK = {
        USER      = 'user',
        VIP       = 'vip',
        MODERATOR = 'moderator',
        ADMIN     = 'admin',
        DEVELOPER = 'developer',
        OWNER     = 'owner',
    },

    RANK_LEVEL = {
        user      = 0,
        vip       = 1,
        moderator = 2,
        admin     = 3,
        developer = 4,
        owner     = 5,
    },

    LOG = {
        SYSTEM = 'system',
        ADMIN  = 'admin',
        PLAYER = 'player',
        COMBAT = 'combat',
        ERROR  = 'error',
    },

    EVENT = {
        CORE_READY     = 'aw:core:ready',
        PLAYER_LOADED  = 'aw:player:loaded',
        PLAYER_DROPPED = 'aw:player:dropped',
        CALLBACK       = 'aw:callback',
        CALLBACK_RESP  = 'aw:callback:response',
        UI_MESSAGE     = 'aw:ui:message',
        UI_CLOSE       = 'aw:ui:close',
        NET_PREFIX     = 'aw:net:',
    },

    TABLE = {
        PLAYERS     = 'aw_players',
        PERMISSIONS = 'aw_permissions',
        LOGS        = 'aw_logs',
        CONFIG      = 'aw_config',
    },

    IDENTIFIER = {
        LICENSE = 'license',
        STEAM   = 'steam',
        DISCORD = 'discord',
        FIVEM   = 'fivem',
        IP      = 'ip',
    },
}
