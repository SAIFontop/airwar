fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'aw-hud'
description 'AIRWAR — HUD, NUI bridge, all UI panels'
version '1.0.0'

dependencies {
    'aw-core',
}

client_scripts {
    '@aw-core/shared/constants.lua',
    '@aw-core/shared/contracts.lua',
    '@aw-core/shared/utils.lua',
    'client.lua',
}

ui_page 'html/dist/index.html'

files {
    'html/dist/**/*',
}
