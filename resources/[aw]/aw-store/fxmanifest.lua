fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'aw-store'
description 'AIRWAR — Economy & Store System'
author 'AIRWAR Framework'
version '1.0.0'

dependencies {
    'aw-core',
    'aw-config',
}

server_scripts {
    '@aw-core/shared/constants.lua',
    '@aw-core/shared/utils.lua',
    'server.lua',
}

provides {
    'GetBalance',
    'AddBalance',
    'DeductBalance',
    'PurchaseAircraft',
    'PurchaseWeapon',
    'PurchaseItem',
    'GetTransactionHistory',
    'GetOwnedItems',
}
