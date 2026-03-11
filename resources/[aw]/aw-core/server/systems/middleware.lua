--[[
    System 14: Middleware
    Pipeline middleware for events and API calls
    Supports before/after hooks, rate limiting, logging
]]

local Middleware = {}
Middleware.__index = Middleware

local pipelines = {}  -- { [name] = { before = {}, after = {} } }

-- ============================================================
-- CORE API
-- ============================================================

function Middleware.Init()
    CoreLogger.Info('middleware', 'Middleware system initialized')
end

--- Register a middleware pipeline
---@param name string Pipeline name (e.g., "event:aw:combat:fired")
function Middleware.CreatePipeline(name)
    if not pipelines[name] then
        pipelines[name] = { before = {}, after = {} }
    end
end

--- Add a before-hook to a pipeline
---@param name string Pipeline name
---@param priority number Lower = runs first
---@param handler function (context) -> context|nil (nil = abort)
---@param label string|nil
function Middleware.Before(name, priority, handler, label)
    Middleware.CreatePipeline(name)
    local hooks = pipelines[name].before
    hooks[#hooks + 1] = { priority = priority, handler = handler, label = label or 'unnamed' }
    table.sort(hooks, function(a, b) return a.priority < b.priority end)
    CoreLogger.Debug('middleware', 'Before hook added to "%s" (prio %d, label "%s")', name, priority, label or 'unnamed')
end

--- Add an after-hook to a pipeline
---@param name string Pipeline name
---@param priority number Lower = runs first
---@param handler function (context, result)
---@param label string|nil
function Middleware.After(name, priority, handler, label)
    Middleware.CreatePipeline(name)
    local hooks = pipelines[name].after
    hooks[#hooks + 1] = { priority = priority, handler = handler, label = label or 'unnamed' }
    table.sort(hooks, function(a, b) return a.priority < b.priority end)
end

--- Execute a pipeline
---@param name string Pipeline name
---@param context table Context data passed through all hooks
---@param executor function The actual operation to execute
---@return boolean success
---@return any result
function Middleware.Execute(name, context, executor)
    local pipeline = pipelines[name]

    -- Run before hooks
    if pipeline then
        for _, hook in ipairs(pipeline.before) do
            local ok, result = pcall(hook.handler, context)
            if not ok then
                CoreLogger.Error('middleware', 'Before hook "%s" in pipeline "%s" error: %s', hook.label, name, tostring(result))
                return false, 'middleware_error'
            end
            if result == false then
                CoreLogger.Debug('middleware', 'Pipeline "%s" aborted by before hook "%s"', name, hook.label)
                return false, 'aborted_by_' .. hook.label
            end
            if type(result) == 'table' then
                context = result
            end
        end
    end

    -- Execute the actual operation
    local execOk, execResult = pcall(executor, context)
    if not execOk then
        CoreLogger.Error('middleware', 'Pipeline "%s" executor error: %s', name, tostring(execResult))
        return false, 'executor_error'
    end

    -- Run after hooks
    if pipeline then
        for _, hook in ipairs(pipeline.after) do
            local ok, err = pcall(hook.handler, context, execResult)
            if not ok then
                CoreLogger.Error('middleware', 'After hook "%s" in pipeline "%s" error: %s', hook.label, name, tostring(err))
            end
        end
    end

    return true, execResult
end

--- Get pipeline info (for debug)
---@return table
function Middleware.GetPipelineInfo()
    local info = {}
    for name, pipeline in pairs(pipelines) do
        info[name] = {
            before_count = #pipeline.before,
            after_count = #pipeline.after,
        }
    end
    return info
end

--- Create a rate limiter middleware
---@param maxCalls number Max calls per window
---@param windowMs number Window in milliseconds
---@return function Middleware handler
function Middleware.RateLimiter(maxCalls, windowMs)
    local calls = {} -- { [source] = { count, windowStart } }

    return function(context)
        local source = context.source or 'unknown'
        local now = GetGameTimer()

        if not calls[source] or (now - calls[source].windowStart) > windowMs then
            calls[source] = { count = 0, windowStart = now }
        end

        calls[source].count = calls[source].count + 1

        if calls[source].count > maxCalls then
            CoreLogger.Warn('middleware', 'Rate limit exceeded for %s', source)
            return false
        end

        return context
    end
end

CoreMiddleware = Middleware
