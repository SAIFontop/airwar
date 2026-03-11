-- ═══════════════════════════════════════════════════════════
-- System 2: Error Handling
-- ═══════════════════════════════════════════════════════════

Core.Error = {}

function Core.Error.Try(fn, ...)
    local ok, result = xpcall(fn, function(err)
        local trace = debug.traceback(err, 2)
        Core.Log.Error('error', trace)
        return err
    end, ...)
    return ok, result
end

function Core.Error.Wrap(fn)
    return function(...)
        return Core.Error.Try(fn, ...)
    end
end

function Core.Error._init()
    Core.Log.Info('core', 'Error handler initialized')
end
