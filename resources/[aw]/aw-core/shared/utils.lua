--[[
    AIRWAR Core - Shared Utilities
    Table, math, string helpers used across all resources
]]

Utils = {}

-- ============================================================
-- STRING UTILITIES
-- ============================================================

--- Generate a random hex string of given length
---@param length number Number of hex characters
---@return string
function Utils.RandomHex(length)
    local chars = '0123456789ABCDEF'
    local result = {}
    for i = 1, length do
        local idx = math.random(1, 16)
        result[i] = chars:sub(idx, idx)
    end
    return table.concat(result)
end

--- Generate an AIRWAR ID with prefix
---@param prefix string From AW.PREFIX
---@param length number Hex length (6 for player, 8 for others)
---@return string
function Utils.GenerateId(prefix, length)
    return prefix .. Utils.RandomHex(length)
end

--- Trim whitespace from both ends
---@param s string
---@return string
function Utils.Trim(s)
    return s:match('^%s*(.-)%s*$')
end

--- Split string by delimiter
---@param str string
---@param sep string
---@return table
function Utils.Split(str, sep)
    local result = {}
    for part in str:gmatch('([^' .. sep .. ']+)') do
        result[#result + 1] = part
    end
    return result
end

-- ============================================================
-- TABLE UTILITIES
-- ============================================================

--- Deep copy a table
---@param orig table
---@return table
function Utils.DeepCopy(orig)
    if type(orig) ~= 'table' then return orig end
    local copy = {}
    for k, v in pairs(orig) do
        copy[Utils.DeepCopy(k)] = Utils.DeepCopy(v)
    end
    return setmetatable(copy, getmetatable(orig))
end

--- Shallow merge tables (later tables override earlier)
---@param ... table
---@return table
function Utils.Merge(...)
    local result = {}
    for _, tbl in ipairs({...}) do
        if type(tbl) == 'table' then
            for k, v in pairs(tbl) do
                result[k] = v
            end
        end
    end
    return result
end

--- Count entries in a table (not just array part)
---@param tbl table
---@return number
function Utils.TableCount(tbl)
    local count = 0
    for _ in pairs(tbl) do count = count + 1 end
    return count
end

--- Check if table contains a value
---@param tbl table
---@param value any
---@return boolean
function Utils.TableContains(tbl, value)
    for _, v in pairs(tbl) do
        if v == value then return true end
    end
    return false
end

--- Get table keys as array
---@param tbl table
---@return table
function Utils.TableKeys(tbl)
    local keys = {}
    for k in pairs(tbl) do
        keys[#keys + 1] = k
    end
    return keys
end

--- Filter table by predicate function
---@param tbl table
---@param fn function
---@return table
function Utils.TableFilter(tbl, fn)
    local result = {}
    for k, v in pairs(tbl) do
        if fn(v, k) then result[k] = v end
    end
    return result
end

--- Map over table values
---@param tbl table
---@param fn function
---@return table
function Utils.TableMap(tbl, fn)
    local result = {}
    for k, v in pairs(tbl) do
        result[k] = fn(v, k)
    end
    return result
end

-- ============================================================
-- MATH UTILITIES
-- ============================================================

--- Clamp value between min and max
---@param val number
---@param min number
---@param max number
---@return number
function Utils.Clamp(val, min, max)
    if val < min then return min end
    if val > max then return max end
    return val
end

--- Linear interpolation
---@param a number
---@param b number
---@param t number (0-1)
---@return number
function Utils.Lerp(a, b, t)
    return a + (b - a) * Utils.Clamp(t, 0.0, 1.0)
end

--- Calculate 3D distance
---@param x1 number
---@param y1 number
---@param z1 number
---@param x2 number
---@param y2 number
---@param z2 number
---@return number
function Utils.Distance3D(x1, y1, z1, x2, y2, z2)
    local dx = x2 - x1
    local dy = y2 - y1
    local dz = z2 - z1
    return math.sqrt(dx*dx + dy*dy + dz*dz)
end

--- Calculate 2D distance (ignoring Z)
---@param x1 number
---@param y1 number
---@param x2 number
---@param y2 number
---@return number
function Utils.Distance2D(x1, y1, x2, y2)
    local dx = x2 - x1
    local dy = y2 - y1
    return math.sqrt(dx*dx + dy*dy)
end

--- Convert knots to m/s
---@param knots number
---@return number
function Utils.KnotsToMs(knots)
    return knots * 0.514444
end

--- Convert m/s to knots
---@param ms number
---@return number
function Utils.MsToKnots(ms)
    return ms / 0.514444
end

--- Round to decimal places
---@param num number
---@param places number
---@return number
function Utils.Round(num, places)
    local mult = 10 ^ (places or 0)
    return math.floor(num * mult + 0.5) / mult
end

-- ============================================================
-- TIME UTILITIES
-- ============================================================

--- Get current timestamp in milliseconds
---@return number
function Utils.GetTimeMs()
    return GetGameTimer()
end

--- Get current timestamp in seconds (float)
---@return number
function Utils.GetTime()
    return GetGameTimer() / 1000.0
end

--- Format seconds to MM:SS
---@param seconds number
---@return string
function Utils.FormatTime(seconds)
    local m = math.floor(seconds / 60)
    local s = math.floor(seconds % 60)
    return string.format('%02d:%02d', m, s)
end

-- ============================================================
-- HASH UTILITIES (for IP hashing)
-- ============================================================

--- Simple string hash (NOT cryptographic, for cache keys only)
---@param str string
---@return string
function Utils.SimpleHash(str)
    return tostring(GetHashKey(str))
end

-- ============================================================
-- VALIDATION
-- ============================================================

--- Validate a string matches AWID format
---@param id string
---@param prefix string Expected prefix
---@return boolean
function Utils.IsValidId(id, prefix)
    if type(id) ~= 'string' then return false end
    if not id:find('^' .. prefix:gsub('%-', '%%-')) then return false end
    local hex = id:sub(#prefix + 1)
    return hex:match('^[0-9A-F]+$') ~= nil
end
