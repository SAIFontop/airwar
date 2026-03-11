--[[
    HTTP Router
    FiveM HTTP handler that routes /api/v1/* requests
]]

local HttpRouter = {}
HttpRouter.__index = HttpRouter

local routes = {} -- { { method, pattern, handler, permission } }

-- ============================================================
-- ROUTE REGISTRATION
-- ============================================================

--- Register an HTTP route
---@param method string 'GET' | 'POST' | 'PUT' | 'DELETE'
---@param path string e.g. '/api/v1/players'
---@param handler function (req, params) -> { status, data } or { status, error }
---@param permission string|nil Required API key permission scope
function HttpRouter.Route(method, path, handler, permission)
    routes[#routes + 1] = {
        method     = method:upper(),
        pattern    = path,
        handler    = handler,
        permission = permission,
    }
end

--- Match a request to a route, extracting path params
---@param method string
---@param path string
---@return table|nil route
---@return table params Extracted :param values
local function matchRoute(method, path)
    for _, route in ipairs(routes) do
        if route.method == method then
            -- Convert /api/v1/players/:awid to pattern
            local paramNames = {}
            local pattern = route.pattern:gsub(':([%w_]+)', function(name)
                paramNames[#paramNames + 1] = name
                return '([^/]+)'
            end)
            pattern = '^' .. pattern .. '$'

            local captures = { path:match(pattern) }
            if #captures > 0 then
                local params = {}
                for i, name in ipairs(paramNames) do
                    params[name] = captures[i]
                end
                return route, params
            elseif path:match('^' .. route.pattern:gsub('%-', '%%-') .. '$') then
                return route, {}
            end
        end
    end
    return nil, {}
end

-- ============================================================
-- REQUEST HANDLER
-- ============================================================

--- Handle an incoming HTTP request from FiveM
---@param req table FiveM request object
---@param res table FiveM response object
function HttpRouter.HandleRequest(req, res)
    local method = req.method
    local path = req.path

    -- CORS headers
    res.writeHead(200, {
        ['Content-Type']                 = 'application/json',
        ['Access-Control-Allow-Origin']  = '*',
        ['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS',
        ['Access-Control-Allow-Headers'] = 'Content-Type, Authorization',
    })

    -- OPTIONS preflight
    if method == 'OPTIONS' then
        res.send('')
        return
    end

    -- Auth
    local authResult = HttpAuth.Authenticate(req)
    if not authResult.authenticated then
        res.send(json.encode({
            status = 'error',
            error  = { code = 'UNAUTHORIZED', message = authResult.reason or 'Invalid API key' },
            meta   = { timestamp = os.time(), version = 'v1' },
        }))
        return
    end

    -- Route matching
    local route, params = matchRoute(method, path)
    if not route then
        res.send(json.encode({
            status = 'error',
            error  = { code = 'NOT_FOUND', message = 'Endpoint not found' },
            meta   = { timestamp = os.time(), version = 'v1' },
        }))
        return
    end

    -- Permission check
    if route.permission and not HttpAuth.HasScope(authResult, route.permission) then
        res.send(json.encode({
            status = 'error',
            error  = { code = 'FORBIDDEN', message = 'Insufficient API key permissions' },
            meta   = { timestamp = os.time(), version = 'v1' },
        }))
        return
    end

    -- Parse body for POST/PUT
    local body = nil
    if req.body and #req.body > 0 then
        local ok, parsed = pcall(json.decode, req.body)
        if ok then body = parsed end
    end

    -- Execute handler
    local ok, result = pcall(route.handler, { params = params, body = body, auth = authResult }, params)
    if not ok then
        CoreLogger.Error('http', '%s %s error: %s', method, path, tostring(result))
        res.send(json.encode({
            status = 'error',
            error  = { code = 'INTERNAL_ERROR', message = 'Internal server error' },
            meta   = { timestamp = os.time(), version = 'v1' },
        }))
        return
    end

    -- Send response
    res.send(json.encode({
        status = result.status or 'ok',
        data   = result.data,
        error  = result.error,
        meta   = { timestamp = os.time(), version = 'v1' },
    }))
end

--- Get route count
---@return number
function HttpRouter.GetRouteCount()
    return #routes
end

CoreHttpRouter = HttpRouter
