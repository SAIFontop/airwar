--[[
    System 15: Validator
    Schema validation for configs, API inputs, module registration
]]

local Validator = {}
Validator.__index = Validator

local schemas = {}

-- ============================================================
-- SCHEMA DEFINITIONS
-- ============================================================

--- Register a validation schema
---@param name string Schema name
---@param schema table Schema definition
function Validator.RegisterSchema(name, schema)
    schemas[name] = schema
    CoreLogger.Debug('validator', 'Schema registered: %s', name)
end

--- Validate data against a named schema
---@param schemaName string
---@param data any
---@return boolean valid
---@return string|nil error
function Validator.Validate(schemaName, data)
    local schema = schemas[schemaName]
    if not schema then
        return false, 'Unknown schema: ' .. schemaName
    end
    return Validator.ValidateSchema(schema, data, schemaName)
end

--- Validate data against an inline schema definition
---@param schema table
---@param data any
---@param path string Current path for error messages
---@return boolean
---@return string|nil
function Validator.ValidateSchema(schema, data, path)
    path = path or 'root'

    -- Type check
    if schema.type then
        local actualType = type(data)
        if schema.type == 'integer' then
            if actualType ~= 'number' or data ~= math.floor(data) then
                return false, path .. ': expected integer, got ' .. actualType
            end
        elseif actualType ~= schema.type then
            -- Allow nil if optional
            if data == nil and schema.optional then
                return true, nil
            end
            return false, path .. ': expected ' .. schema.type .. ', got ' .. actualType
        end
    end

    -- Required check
    if data == nil then
        if schema.required then
            return false, path .. ': required field is nil'
        end
        return true, nil
    end

    -- String constraints
    if schema.type == 'string' and type(data) == 'string' then
        if schema.min_length and #data < schema.min_length then
            return false, path .. ': string too short (min ' .. schema.min_length .. ')'
        end
        if schema.max_length and #data > schema.max_length then
            return false, path .. ': string too long (max ' .. schema.max_length .. ')'
        end
        if schema.pattern and not data:match(schema.pattern) then
            return false, path .. ': does not match pattern'
        end
        if schema.enum then
            local found = false
            for _, v in ipairs(schema.enum) do
                if v == data then found = true; break end
            end
            if not found then
                return false, path .. ': value not in enum'
            end
        end
    end

    -- Number constraints
    if (schema.type == 'number' or schema.type == 'integer') and type(data) == 'number' then
        if schema.min and data < schema.min then
            return false, path .. ': below minimum ' .. schema.min
        end
        if schema.max and data > schema.max then
            return false, path .. ': above maximum ' .. schema.max
        end
    end

    -- Table / object constraints
    if schema.type == 'table' and type(data) == 'table' then
        -- Validate required fields
        if schema.fields then
            for fieldName, fieldSchema in pairs(schema.fields) do
                local ok, err = Validator.ValidateSchema(fieldSchema, data[fieldName], path .. '.' .. fieldName)
                if not ok then return false, err end
            end
        end

        -- Validate array items
        if schema.items then
            for i, item in ipairs(data) do
                local ok, err = Validator.ValidateSchema(schema.items, item, path .. '[' .. i .. ']')
                if not ok then return false, err end
            end
        end
    end

    -- Custom validator function
    if schema.validate and type(schema.validate) == 'function' then
        local ok, err = schema.validate(data)
        if not ok then
            return false, path .. ': ' .. (err or 'custom validation failed')
        end
    end

    return true, nil
end

-- ============================================================
-- BUILT-IN SCHEMAS
-- ============================================================

function Validator.RegisterBuiltInSchemas()
    -- Aircraft type schema
    Validator.RegisterSchema('aircraft_type', {
        type = 'table',
        fields = {
            display     = { type = 'string', required = true, min_length = 1, max_length = 64 },
            model       = { type = 'string', required = true },
            role        = { type = 'string', required = true, enum = { 'fighter', 'bomber', 'multirole', 'interceptor', 'attacker', 'recon', 'awacs', 'tanker', 'transport', 'gunship', 'vtol', 'drone', 'trainer', 'stealth' } },
            mass        = { type = 'number', required = true, min = 100 },
            fuel_capacity = { type = 'number', required = true, min = 1 },
            max_speed   = { type = 'number', required = true, min = 1 },
            hardpoints  = { type = 'integer', required = true, min = 0 },
            radar_range = { type = 'number', optional = true, min = 0 },
            price       = { type = 'integer', required = true, min = 0 },
            tier        = { type = 'string', optional = true, enum = { 'basic', 'advanced', 'elite', 'special' } },
        },
    })

    -- Weapon type schema
    Validator.RegisterSchema('weapon_type', {
        type = 'table',
        fields = {
            display     = { type = 'string', required = true },
            type        = { type = 'string', required = true, enum = { 'gun', 'aim_ir', 'aim_radar', 'agm', 'bomb_dumb', 'bomb_guided', 'rocket', 'torpedo' } },
            damage      = { type = 'number', required = true, min = 0 },
            range       = { type = 'number', required = true, min = 0 },
            ammo        = { type = 'integer', optional = true, min = 1 },
            lock_time   = { type = 'number', optional = true, min = 0 },
            lock_cone   = { type = 'number', optional = true, min = 0, max = 360 },
            price       = { type = 'integer', optional = true, min = 0 },
        },
    })

    -- Faction schema
    Validator.RegisterSchema('faction', {
        type = 'table',
        fields = {
            display  = { type = 'string', required = true },
            color    = { type = 'string', required = true }, -- Hex color
            emblem   = { type = 'string', optional = true },
            spawn    = { type = 'table', optional = true },  -- { x, y, z, heading }
        },
    })

    -- Module registration schema
    Validator.RegisterSchema('module_registration', {
        type = 'table',
        fields = {
            name             = { type = 'string', required = true, min_length = 1 },
            version          = { type = 'integer', required = true, min = 1 },
            requires         = { type = 'table', optional = true },
            modifies_players = { type = 'boolean', optional = true },
            provides_http    = { type = 'boolean', optional = true },
        },
    })

    CoreLogger.Debug('validator', 'Built-in schemas registered')
end

CoreValidator = Validator
