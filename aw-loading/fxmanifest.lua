fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'aw-loading'
description 'AIRWAR Loading Screen'
author 'AIRWAR'
version '1.0.0'
loadscreen 'html/index.html'
loadscreen_cursor 'yes'
loadscreen_manual_shutdown 'yes'

files {
    'html/index.html',
    'html/assets/**/*',
}

client_script 'client.lua'
