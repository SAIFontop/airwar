-- ═══════════════════════════════════════════════════════════
-- System 14: Command Framework
-- RegisterCommand wrapper with permissions + arg parsing
-- ═══════════════════════════════════════════════════════════

Core.Command = {}

local _commands = {}

function Core.Command.Register(name, description, permission, callback)
    local cmd = name:lower()
    _commands[cmd] = {
        name        = cmd,
        description = description or '',
        permission  = permission,
        callback    = callback,
    }

    RegisterCommand(cmd, function(source, args)
        local raw = table.concat(args, ' ')

        -- Console (source = 0)
        if source == 0 then
            Core.Error.Try(callback, 0, args, raw)
            return
        end

        -- Permission check
        if permission and not Core.Permission.Has(source, permission) then
            TriggerClientEvent('chat:addMessage', source, {
                args = { AW.PREFIX .. 'No permission.' }
            })
            return
        end

        Core.Error.Try(callback, source, args, raw)
    end, false)

    Core.Log.Debug('commands', 'Registered: /%s', cmd)
end

function Core.Command.GetAll()
    local list = {}
    for name, cmd in pairs(_commands) do
        list[#list + 1] = {
            name        = name,
            description = cmd.description,
            permission  = cmd.permission,
        }
    end
    table.sort(list, function(a, b) return a.name < b.name end)
    return list
end

function Core.Command._init()
    -- Built-in /help
    Core.Command.Register('help', 'Show available commands', nil, function(source)
        local cmds = Core.Command.GetAll()

        if source == 0 then
            print(AW.PREFIX .. 'Commands:')
            for _, cmd in ipairs(cmds) do
                print(string.format('  /%s — %s', cmd.name, cmd.description))
            end
            return
        end

        TriggerClientEvent('chat:addMessage', source, {
            color = { 255, 180, 0 },
            multiline = true,
            args = { '[AW]', 'Available Commands:' }
        })

        for _, cmd in ipairs(cmds) do
            if not cmd.permission or Core.Permission.Has(source, cmd.permission) then
                TriggerClientEvent('chat:addMessage', source, {
                    color = { 200, 200, 200 },
                    multiline = true,
                    args = { '', string.format('^3/%s ^0— %s', cmd.name, cmd.description) }
                })
            end
        end
    end)

    Core.Log.Info('core', 'Command framework initialized')
end
