-- ═══════════════════════════════════════════════════════════
-- Client Entity Helpers
-- ═══════════════════════════════════════════════════════════

Core.Entity = {}

function Core.Entity.GetClosest(coords, entityType, maxDist)
    coords  = coords or GetEntityCoords(PlayerPedId())
    maxDist = maxDist or 50.0

    local pool
    if entityType == 'vehicle' then
        pool = GetGamePool('CVehicle')
    elseif entityType == 'ped' then
        pool = GetGamePool('CPed')
    elseif entityType == 'object' then
        pool = GetGamePool('CObject')
    else
        pool = GetGamePool('CVehicle')
    end

    local closest, closestDist = nil, maxDist
    for _, entity in ipairs(pool) do
        local pos  = GetEntityCoords(entity)
        local dist = #(coords - pos)
        if dist < closestDist then
            closestDist = dist
            closest     = entity
        end
    end

    return closest, closestDist
end

function Core.Entity.GetInRange(coords, entityType, range)
    coords = coords or GetEntityCoords(PlayerPedId())
    range  = range or 50.0

    local pool
    if entityType == 'vehicle' then
        pool = GetGamePool('CVehicle')
    elseif entityType == 'ped' then
        pool = GetGamePool('CPed')
    elseif entityType == 'object' then
        pool = GetGamePool('CObject')
    else
        pool = GetGamePool('CVehicle')
    end

    local result = {}
    for _, entity in ipairs(pool) do
        local pos  = GetEntityCoords(entity)
        local dist = #(coords - pos)
        if dist <= range then
            result[#result + 1] = { entity = entity, distance = dist }
        end
    end

    table.sort(result, function(a, b) return a.distance < b.distance end)
    return result
end
