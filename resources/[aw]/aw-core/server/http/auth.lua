--[[
    HTTP Authentication
    Bearer token validation with scoped API keys
]]

local Auth = {}
Auth.__index = Auth

-- Loaded from convar: aw_api_keys (JSON)
-- Format: { "key_hash": { scope: "admin"|"read"|"full", label: "My Bot" } }
local apiKeys = {}

function Auth.Init()
    local keysJson = GetConvar('aw_api_keys', '{}')
    local ok, keys = pcall(json.decode, keysJson)
    if ok and type(keys) == 'table' then
        apiKeys = keys
    end
    CoreLogger.Info('http:auth', 'HTTP auth initialized (%d API keys)', Utils.TableCount(apiKeys))
end

--- Authenticate an HTTP request
---@param req table FiveM request
---@return table { authenticated: bool, scope: string|nil, label: string|nil, reason: string|nil }
function Auth.Authenticate(req)
    local authHeader = nil

    -- FiveM passes headers as a table
    if req.headers then
        authHeader = req.headers['Authorization'] or req.headers['authorization']
    end

    if not authHeader then
        return { authenticated = false, reason = 'Missing Authorization header' }
    end

    -- Extract bearer token
    local token = authHeader:match('^Bearer%s+(.+)$')
    if not token then
        return { authenticated = false, reason = 'Invalid Authorization format (expected Bearer)' }
    end

    -- Hash the token and look up
    local tokenHash = Utils.SimpleHash(token)
    local keyEntry = apiKeys[tokenHash]

    if not keyEntry then
        CoreLogger.Warn('http:auth', 'Invalid API key attempt')
        return { authenticated = false, reason = 'Invalid API key' }
    end

    return {
        authenticated = true,
        scope         = keyEntry.scope or 'read',
        label         = keyEntry.label or 'unknown',
    }
end

--- Check if an auth result has a required scope
---@param authResult table
---@param requiredScope string
---@return boolean
function Auth.HasScope(authResult, requiredScope)
    if not authResult.authenticated then return false end

    local scope = authResult.scope
    -- full > admin > read
    if scope == 'full' then return true end
    if scope == 'admin' and (requiredScope == 'admin' or requiredScope == 'read') then return true end
    if scope == 'read' and requiredScope == 'read' then return true end

    return false
end

HttpAuth = Auth
