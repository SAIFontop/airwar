Utils = {}

-- ═══════════════════════════════════════════════════════════
-- MATH
-- ═══════════════════════════════════════════════════════════

function Utils.Clamp(val, min, max)
    return math.max(min, math.min(max, val))
end

function Utils.Lerp(a, b, t)
    return a + (b - a) * t
end

function Utils.Round(val, dec)
    dec = dec or 0
    local mult = 10 ^ dec
    return math.floor(val * mult + 0.5) / mult
end

function Utils.Distance(a, b)
    local dx = a.x - b.x
    local dy = a.y - b.y
    local dz = (a.z or 0) - (b.z or 0)
    return math.sqrt(dx * dx + dy * dy + dz * dz)
end

-- ═══════════════════════════════════════════════════════════
-- TABLE
-- ═══════════════════════════════════════════════════════════

function Utils.TableCount(t)
    local n = 0
    for _ in pairs(t) do n = n + 1 end
    return n
end

function Utils.TableCopy(t)
    if type(t) ~= 'table' then return t end
    local copy = {}
    for k, v in pairs(t) do copy[k] = Utils.TableCopy(v) end
    return copy
end

function Utils.TableMerge(base, override)
    local result = Utils.TableCopy(base)
    for k, v in pairs(override) do
        if type(v) == 'table' and type(result[k]) == 'table' then
            result[k] = Utils.TableMerge(result[k], v)
        else
            result[k] = v
        end
    end
    return result
end

function Utils.TableContains(t, val)
    for _, v in pairs(t) do
        if v == val then return true end
    end
    return false
end

function Utils.TableKeys(t)
    local keys = {}
    for k in pairs(t) do keys[#keys + 1] = k end
    return keys
end

function Utils.TableValues(t)
    local vals = {}
    for _, v in pairs(t) do vals[#vals + 1] = v end
    return vals
end

function Utils.TableFilter(t, fn)
    local result = {}
    for k, v in pairs(t) do
        if fn(v, k) then result[#result + 1] = v end
    end
    return result
end

function Utils.TableMap(t, fn)
    local result = {}
    for k, v in pairs(t) do result[#result + 1] = fn(v, k) end
    return result
end

-- ═══════════════════════════════════════════════════════════
-- STRING
-- ═══════════════════════════════════════════════════════════

function Utils.Split(str, sep)
    local parts = {}
    for part in str:gmatch('[^' .. (sep or ' ') .. ']+') do
        parts[#parts + 1] = part
    end
    return parts
end

function Utils.Trim(str)
    return str:match('^%s*(.-)%s*$')
end

function Utils.StartsWith(str, prefix)
    return str:sub(1, #prefix) == prefix
end

function Utils.EndsWith(str, suffix)
    return str:sub(-#suffix) == suffix
end

function Utils.FormatNumber(n)
    local s = tostring(math.floor(n))
    local pos = #s % 3
    if pos == 0 then pos = 3 end
    return s:sub(1, pos) .. s:sub(pos + 1):gsub('(%d%d%d)', ',%1')
end

-- ═══════════════════════════════════════════════════════════
-- ID GENERATION
-- ═══════════════════════════════════════════════════════════

function Utils.GenerateId(prefix, length)
    prefix = prefix or ''
    length = length or 8
    local chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    local id = prefix
    for _ = 1, length do
        local idx = math.random(1, #chars)
        id = id .. chars:sub(idx, idx)
    end
    return id
end

-- ═══════════════════════════════════════════════════════════
-- VECTOR
-- ═══════════════════════════════════════════════════════════

function Utils.HeadingToDirection(heading)
    local rad = math.rad(heading)
    return { x = -math.sin(rad), y = math.cos(rad), z = 0.0 }
end

function Utils.ForwardPosition(pos, heading, distance)
    local dir = Utils.HeadingToDirection(heading)
    return {
        x = pos.x + dir.x * distance,
        y = pos.y + dir.y * distance,
        z = pos.z + (dir.z or 0) * distance,
    }
end
