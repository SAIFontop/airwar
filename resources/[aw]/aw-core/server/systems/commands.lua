--[[
    System 13: Commands
    Chat command registration with arg parsing, permissions, cooldowns
]]

local Commands = {}
Commands.__index = Commands

local registeredCommands = {} -- { [name] = commandDef }

-- ============================================================
-- INTERNAL
-- ============================================================

--- Parse a raw arguments string into typed values based on arg definitions
---@param raw string The raw argument string from chat
---@param argDefs table Array of { name, type, required, default }
---@return table|nil parsed
---@return string|nil error
local function parseArgs(raw, argDefs)
    local parts = {}
    -- Split by spaces, respecting "quoted strings"
    local inQuote = false
    local current = ''
    for i = 1, #raw do
        local c = raw:sub(i, i)
        if c == '"' then
            inQuote = not inQuote
        elseif c == ' ' and not inQuote then
            if #current > 0 then
                parts[#parts + 1] = current
                current = ''
            end
        else
            current = current .. c
        end
    end
    if #current > 0 then
        parts[#parts + 1] = current
    end

    local parsed = {}
    for i, def in ipairs(argDefs) do
        local value = parts[i]
        if value == nil then
            if def.required then
                return nil, string.format('Missing required argument: %s', def.name)
            end
            parsed[def.name] = def.default
        else
            -- Type coercion
            if def.type == 'number' then
                value = tonumber(value)
                if not value then
                    return nil, string.format('Argument "%s" must be a number', def.name)
                end
            elseif def.type == 'boolean' then
                value = value == 'true' or value == '1' or value == 'yes'
            end
            parsed[def.name] = value
        end
    end

    return parsed, nil
end

-- ============================================================
-- PUBLIC API
-- ============================================================

function Commands.Init()
    CoreLogger.Info('commands', 'Command system initialized')
end

--- Register a chat command
---@param name string Command name (without /)
---@param opts table { description, args, permission, cooldown, handler }
function Commands.Register(name, opts)
    local cmdName = name:lower()
    registeredCommands[cmdName] = {
        name        = cmdName,
        description = opts.description or '',
        args        = opts.args or {},        -- { { name='target', type='string', required=true }, ... }
        permission  = opts.permission or nil,
        cooldown    = opts.cooldown or 0,     -- seconds
        handler     = opts.handler,
        lastUsed    = {},                     -- { [awid] = timestamp }
    }

    RegisterCommand(cmdName, function(source, rawArgs)
        Commands._Execute(source, cmdName, table.concat(rawArgs, ' '))
    end, false)

    CoreLogger.Debug('commands', 'Registered command: /%s', cmdName)
end

--- Internal command executor
---@param source number Server ID
---@param cmdName string
---@param rawArgs string
function Commands._Execute(source, cmdName, rawArgs)
    local cmd = registeredCommands[cmdName]
    if not cmd then return end

    -- Console command (source = 0)
    if source == 0 then
        local parsed, err = parseArgs(rawArgs, cmd.args)
        if not parsed then
            print(string.format('[AIRWAR] Command error: %s', err))
            return
        end
        local ok, execErr = pcall(cmd.handler, nil, parsed)
        if not ok then
            CoreLogger.Error('commands', 'Console command /%s error: %s', cmdName, tostring(execErr))
        end
        return
    end

    local player = CoreIdentity.GetByServerId(source)
    if not player then return end

    -- Permission check
    if cmd.permission then
        if not CorePermissions.HasPermission(player.awid, cmd.permission) then
            TriggerClientEvent('chat:addMessage', source, {
                args = { AW.CHAT_PREFIX .. 'You don\'t have permission to use this command.' }
            })
            return
        end
    end

    -- Cooldown check
    if cmd.cooldown > 0 then
        local last = cmd.lastUsed[player.awid] or 0
        local now = os.time()
        if (now - last) < cmd.cooldown then
            local remaining = cmd.cooldown - (now - last)
            TriggerClientEvent('chat:addMessage', source, {
                args = { string.format('%sCommand on cooldown (%ds remaining).', AW.CHAT_PREFIX, remaining) }
            })
            return
        end
        cmd.lastUsed[player.awid] = now
    end

    -- Parse arguments
    local parsed, err = parseArgs(rawArgs, cmd.args)
    if not parsed then
        local usage = '/' .. cmdName
        for _, arg in ipairs(cmd.args) do
            if arg.required then
                usage = usage .. ' <' .. arg.name .. '>'
            else
                usage = usage .. ' [' .. arg.name .. ']'
            end
        end
        TriggerClientEvent('chat:addMessage', source, {
            args = { string.format('%s%s | Usage: %s', AW.CHAT_PREFIX, err, usage) }
        })
        return
    end

    -- Execute handler
    local ok, execErr = pcall(cmd.handler, player, parsed)
    if not ok then
        CoreLogger.Error('commands', 'Command /%s error (player %s): %s', cmdName, player.awid, tostring(execErr))
        TriggerClientEvent('chat:addMessage', source, {
            args = { AW.CHAT_PREFIX .. 'An error occurred executing that command.' }
        })
    end
end

--- Get a list of all commands (for help display)
---@return table
function Commands.GetAll()
    local list = {}
    for name, cmd in pairs(registeredCommands) do
        list[#list + 1] = {
            name        = name,
            description = cmd.description,
            permission  = cmd.permission,
            args        = cmd.args,
        }
    end
    table.sort(list, function(a, b) return a.name < b.name end)
    return list
end

--- Get registered command count
---@return number
function Commands.GetCount()
    return Utils.TableCount(registeredCommands)
end

CoreCommands = Commands
