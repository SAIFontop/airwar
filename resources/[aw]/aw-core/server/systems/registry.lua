--[[
    System 7: Registry
    Extensible type registry for aircraft, weapons, factions, loadouts, etc.
    Modules register their types here; other modules query through the Core.
]]

local Registry = {}
Registry.__index = Registry

-- { [domain] = { [typeId] = typeData } }
local registries = {}

-- { [domain] = schema } — optional validation schema per domain
local domainSchemas = {}

-- ============================================================
-- PUBLIC API
-- ============================================================

function Registry.Init()
    -- Pre-create core domains
    registries['aircraft']   = {}
    registries['weapon']     = {}
    registries['faction']    = {}
    registries['loadout']    = {}
    registries['rank']       = {}
    registries['mission']    = {}
    registries['zone']       = {}
    registries['base']       = {}
    registries['cm']         = {}
    registries['upgrade']    = {}
    registries['skin']       = {}
    registries['achievement'] = {}

    CoreLogger.Info('registry', 'Type registry initialized (%d domains)', Utils.TableCount(registries))
end

--- Define a validation schema for a domain
---@param domain string
---@param schema table CoreValidator-compatible schema
function Registry.SetSchema(domain, schema)
    domainSchemas[domain] = schema
    CoreLogger.Debug('registry', 'Schema set for domain: %s', domain)
end

--- Register a type entry in a domain
---@param domain string e.g. 'aircraft', 'weapon'
---@param typeId string e.g. 'f16', 'aim9'
---@param data table The type definition
---@return boolean success
---@return string|nil error
function Registry.Register(domain, typeId, data)
    if not registries[domain] then
        registries[domain] = {}
    end

    -- Validate against domain schema if present
    if domainSchemas[domain] then
        local valid, err = CoreValidator.Validate(data, domainSchemas[domain])
        if not valid then
            CoreLogger.Warn('registry', 'Validation failed for %s/%s: %s', domain, typeId, err)
            return false, err
        end
    end

    if registries[domain][typeId] then
        CoreLogger.Warn('registry', 'Overwriting existing entry: %s/%s', domain, typeId)
    end

    data._id = typeId
    data._domain = domain
    data._registered_at = Utils.GetTimeMs()
    registries[domain][typeId] = data

    CoreLogger.Debug('registry', 'Registered: %s/%s', domain, typeId)
    CoreEvents.Emit('Registry.TypeRegistered', { domain = domain, typeId = typeId })

    return true, nil
end

--- Register multiple entries in a domain at once
---@param domain string
---@param entries table<string, table> { [typeId] = data }
---@return number registered
---@return number failed
function Registry.RegisterBatch(domain, entries)
    local registered, failed = 0, 0
    for typeId, data in pairs(entries) do
        local ok, _ = Registry.Register(domain, typeId, data)
        if ok then
            registered = registered + 1
        else
            failed = failed + 1
        end
    end
    CoreLogger.Info('registry', 'Batch register %s: %d ok, %d failed', domain, registered, failed)
    return registered, failed
end

--- Get a single type entry
---@param domain string
---@param typeId string
---@return table|nil
function Registry.Get(domain, typeId)
    local dom = registries[domain]
    return dom and dom[typeId] or nil
end

--- Get all entries in a domain
---@param domain string
---@return table<string, table>
function Registry.GetAll(domain)
    return registries[domain] or {}
end

--- Get all entries matching a filter function
---@param domain string
---@param filterFn function (typeId, data) -> boolean
---@return table<string, table>
function Registry.Filter(domain, filterFn)
    local results = {}
    local dom = registries[domain]
    if not dom then return results end

    for typeId, data in pairs(dom) do
        if filterFn(typeId, data) then
            results[typeId] = data
        end
    end
    return results
end

--- Get count of entries in a domain
---@param domain string
---@return number
function Registry.Count(domain)
    return Utils.TableCount(registries[domain] or {})
end

--- Check if a type exists
---@param domain string
---@param typeId string
---@return boolean
function Registry.Exists(domain, typeId)
    local dom = registries[domain]
    return dom and dom[typeId] ~= nil
end

--- Remove a type entry
---@param domain string
---@param typeId string
---@return boolean
function Registry.Remove(domain, typeId)
    local dom = registries[domain]
    if not dom or not dom[typeId] then return false end

    dom[typeId] = nil
    CoreLogger.Debug('registry', 'Removed: %s/%s', domain, typeId)
    CoreEvents.Emit('Registry.TypeRemoved', { domain = domain, typeId = typeId })
    return true
end

--- Get all domain names
---@return table
function Registry.GetDomains()
    return Utils.TableKeys(registries)
end

--- Get debug info
---@return table
function Registry.GetStats()
    local stats = {}
    for domain, entries in pairs(registries) do
        stats[domain] = Utils.TableCount(entries)
    end
    return stats
end

CoreRegistry = Registry
