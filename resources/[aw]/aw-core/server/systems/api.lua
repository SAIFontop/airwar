--[[
    System 3: API Router
    Export router and module-to-module communication layer.
    Provides Core.Modules.Call() and manages registered module APIs.
]]

local API = {}
API.__index = API

-- { [moduleId] = { exports = { [name] = fn }, version = n, healthy = bool, disabled = bool } }
local modules = {}
-- { [moduleId] = { dependency1, dependency2 } }
local moduleDeps = {}
-- Access control: { [moduleId] = { requires = {...}, modifies_players = bool, provides_http = bool } }
local moduleAccess = {}
-- Health check functions
local moduleHealthFns = {}

-- ============================================================
-- MODULE REGISTRATION
-- ============================================================

function API.Init()
    CoreLogger.Info('api', 'API Router initialized')
end

--- Register a module with the Core
---@param moduleId string e.g. "aircraft", "combat"
---@param opts table { version, dependencies, exports, access, healthCheck }
---@return boolean success
---@return string|nil error
function API.RegisterModule(moduleId, opts)
    if modules[moduleId] then
        return false, 'Module already registered: ' .. moduleId
    end

    -- Validate contract
    local contract = AW_CONTRACTS and AW_CONTRACTS[moduleId]
    if contract and opts.version then
        if opts.version < contract.version then
            CoreLogger.Warn('api', 'Module %s version %d below contract version %d', moduleId, opts.version, contract.version)
        end
    end

    modules[moduleId] = {
        id       = moduleId,
        version  = opts.version or 1,
        exports  = {},
        healthy  = true,
        disabled = false,
    }

    -- Register exports
    if opts.exports then
        for name, fn in pairs(opts.exports) do
            modules[moduleId].exports[name] = fn
        end
    end

    -- Store dependencies
    moduleDeps[moduleId] = opts.dependencies or {}

    -- Store access declarations
    moduleAccess[moduleId] = opts.access or {}

    -- Store health check
    if opts.healthCheck then
        moduleHealthFns[moduleId] = opts.healthCheck
    end

    CoreLogger.Info('api', 'Module registered: %s (v%d, %d exports)', moduleId, modules[moduleId].version, Utils.TableCount(modules[moduleId].exports))
    CoreEvents.Emit(AW.EVENT.MODULE_REGISTERED, { moduleId = moduleId, version = modules[moduleId].version })

    return true, nil
end

--- Add an export to an already-registered module
---@param moduleId string
---@param name string Export name
---@param fn function
function API.AddExport(moduleId, name, fn)
    local mod = modules[moduleId]
    if not mod then
        CoreLogger.Warn('api', 'Cannot add export to unregistered module: %s', moduleId)
        return
    end
    mod.exports[name] = fn
end

-- ============================================================
-- MODULE ROUTER (inter-module calls)
-- ============================================================

--- Call a module's exported function
---@param targetModule string
---@param exportName string
---@param ... any Arguments
---@return any result
function API.Call(targetModule, exportName, ...)
    local mod = modules[targetModule]
    if not mod then
        CoreLogger.Warn('api', 'Module.Call: unknown module "%s"', targetModule)
        return nil
    end

    if mod.disabled then
        CoreLogger.Warn('api', 'Module.Call: module "%s" is disabled', targetModule)
        return nil
    end

    if not mod.healthy then
        CoreLogger.Warn('api', 'Module.Call: module "%s" is unhealthy', targetModule)
        return nil
    end

    local fn = mod.exports[exportName]
    if not fn then
        CoreLogger.Warn('api', 'Module.Call: export "%s.%s" not found', targetModule, exportName)
        return nil
    end

    local ok, result = pcall(fn, ...)
    if not ok then
        CoreLogger.Error('api', 'Module.Call: %s.%s() error: %s', targetModule, exportName, tostring(result))
        return nil
    end

    return result
end

-- ============================================================
-- MODULE MANAGEMENT
-- ============================================================

--- Disable a module at runtime
---@param moduleId string
---@return boolean
function API.DisableModule(moduleId)
    local mod = modules[moduleId]
    if not mod then return false end

    mod.disabled = true
    CoreLogger.Warn('api', 'Module disabled: %s', moduleId)
    CoreEvents.Emit(AW.EVENT.MODULE_READY, { moduleId = moduleId, status = 'disabled' })
    return true
end

--- Re-enable a module
---@param moduleId string
---@return boolean
function API.EnableModule(moduleId)
    local mod = modules[moduleId]
    if not mod then return false end

    mod.disabled = false
    CoreLogger.Info('api', 'Module re-enabled: %s', moduleId)
    return true
end

--- Set module health status
---@param moduleId string
---@param healthy boolean
function API.SetModuleHealth(moduleId, healthy)
    local mod = modules[moduleId]
    if not mod then return end

    if mod.healthy ~= healthy then
        mod.healthy = healthy
        local status = healthy and 'healthy' or 'unhealthy'
        CoreLogger.Info('api', 'Module health: %s → %s', moduleId, status)
        if not healthy then
            CoreEvents.Emit('Core.ModuleError', { moduleId = moduleId })
        end
    end
end

--- Run health checks on all modules
---@return table { [moduleId] = boolean }
function API.RunHealthChecks()
    local results = {}
    for moduleId, fn in pairs(moduleHealthFns) do
        local ok, healthy = pcall(fn)
        if ok then
            API.SetModuleHealth(moduleId, healthy)
            results[moduleId] = healthy
        else
            API.SetModuleHealth(moduleId, false)
            results[moduleId] = false
        end
    end
    return results
end

--- Get topologically sorted init order
---@return table|nil orderedIds
---@return string|nil error (if cycle detected)
function API.GetInitOrder()
    local visited = {}
    local order = {}
    local visiting = {}

    local function visit(id)
        if visited[id] then return true end
        if visiting[id] then return false end -- cycle
        visiting[id] = true

        local deps = moduleDeps[id] or {}
        for _, dep in ipairs(deps) do
            if modules[dep] then
                if not visit(dep) then
                    return false
                end
            end
        end

        visiting[id] = nil
        visited[id] = true
        order[#order + 1] = id
        return true
    end

    for id in pairs(modules) do
        if not visited[id] then
            if not visit(id) then
                return nil, 'Circular dependency detected involving: ' .. id
            end
        end
    end

    return order, nil
end

--- Check if a module exists and is operational
---@param moduleId string
---@return boolean
function API.IsModuleAvailable(moduleId)
    local mod = modules[moduleId]
    return mod ~= nil and not mod.disabled and mod.healthy
end

--- Get all registered module IDs
---@return table
function API.GetRegisteredModules()
    return Utils.TableKeys(modules)
end

--- Get module info
---@param moduleId string
---@return table|nil
function API.GetModuleInfo(moduleId)
    local mod = modules[moduleId]
    if not mod then return nil end
    return {
        id       = mod.id,
        version  = mod.version,
        healthy  = mod.healthy,
        disabled = mod.disabled,
        exports  = Utils.TableKeys(mod.exports),
    }
end

--- Get all module statuses
---@return table
function API.GetAllModuleStatus()
    local result = {}
    for id, mod in pairs(modules) do
        result[id] = {
            version  = mod.version,
            healthy  = mod.healthy,
            disabled = mod.disabled,
            exports  = Utils.TableCount(mod.exports),
        }
    end
    return result
end

CoreAPI = API
