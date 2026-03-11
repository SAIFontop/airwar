-- ═══════════════════════════════════════════════════════════
-- System 3: Configuration
-- Dot-notation key paths: "server.name", "economy.starting_balance"
-- ═══════════════════════════════════════════════════════════

Core.Config = {}

local _store = {}

function Core.Config.Set(key, value)
    local parts = Utils.Split(key, '.')
    local current = _store
    for i = 1, #parts - 1 do
        if not current[parts[i]] then current[parts[i]] = {} end
        current = current[parts[i]]
    end
    current[parts[#parts]] = value
end

function Core.Config.Get(key, default)
    local parts = Utils.Split(key, '.')
    local current = _store
    for i = 1, #parts do
        if type(current) ~= 'table' then return default end
        current = current[parts[i]]
        if current == nil then return default end
    end
    return current
end

function Core.Config.GetAll()
    return Utils.TableCopy(_store)
end

function Core.Config.Load(data)
    _store = Utils.TableMerge(_store, data)
end

function Core.Config._init()
    Core.Log.Info('core', 'Config system initialized')
end
