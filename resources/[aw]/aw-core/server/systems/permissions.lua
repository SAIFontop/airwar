--[[
    System 6: Permissions
    RBAC with hierarchical permission nodes
    Roles: superadmin, admin, mod, vip, player, guest
]]

local Permissions = {}
Permissions.__index = Permissions

-- Role definitions — higher weight = more authority
local roles = {
    superadmin = { weight = 100, inherits = 'admin',  label = 'Super Admin' },
    admin      = { weight = 80,  inherits = 'mod',    label = 'Admin' },
    mod        = { weight = 60,  inherits = 'vip',    label = 'Moderator' },
    vip        = { weight = 40,  inherits = 'player', label = 'VIP' },
    player     = { weight = 20,  inherits = 'guest',  label = 'Player' },
    guest      = { weight = 0,   inherits = nil,      label = 'Guest' },
}

-- Default permission grants per role (before inheritance)
local rolePermissions = {
    superadmin = {
        'admin.*',
        'server.*',
    },
    admin = {
        AW.PERM.ADMIN_BAN,
        AW.PERM.ADMIN_KICK,
        AW.PERM.ADMIN_SPAWN,
        AW.PERM.ADMIN_TELEPORT,
        AW.PERM.ADMIN_GOD,
        AW.PERM.ADMIN_WEATHER,
        AW.PERM.ADMIN_DEBUG,
        AW.PERM.ADMIN_SPECTATE,
    },
    mod = {
        AW.PERM.ADMIN_MOD,
        AW.PERM.ADMIN_KICK,
        AW.PERM.ADMIN_SPECTATE,
    },
    vip = {
        AW.PERM.AIRCRAFT_ELITE,
        AW.PERM.AIRCRAFT_SPECIAL,
    },
    player = {
        AW.PERM.PLAYER_FLY,
        AW.PERM.PLAYER_CHAT,
        AW.PERM.PLAYER_VOTE,
        AW.PERM.PLAYER_SQUAD_CREATE,
        AW.PERM.AIRCRAFT_BASIC,
        AW.PERM.AIRCRAFT_ADVANCED,
    },
    guest = {},
}

-- Pre-resolved: full permission set per role (including inherited)
local resolvedPermissions = {}

-- Config identifiers → role mappings
local configuredAdmins = {} -- { [identifier] = role }

-- ============================================================
-- INTERNAL
-- ============================================================

--- Resolve all permissions for a role, including inherited roles
local function resolveRole(roleName)
    if resolvedPermissions[roleName] then return resolvedPermissions[roleName] end

    local perms = {}
    local current = roleName
    while current do
        local rolePerms = rolePermissions[current]
        if rolePerms then
            for _, perm in ipairs(rolePerms) do
                perms[perm] = true
            end
        end
        local roleDef = roles[current]
        current = roleDef and roleDef.inherits or nil
    end

    resolvedPermissions[roleName] = perms
    return perms
end

--- Check if a permission node matches (supports wildcards)
---@param granted table<string,boolean> Set of granted permission strings
---@param required string Permission to check
---@return boolean
local function matchPermission(granted, required)
    -- Direct match
    if granted[required] then return true end

    -- Wildcard match: admin.* matches admin.ban, admin.kick, etc.
    local parts = Utils.Split(required, '.')
    local path = ''
    for i = 1, #parts - 1 do
        path = path .. (i > 1 and '.' or '') .. parts[i]
        if granted[path .. '.*'] then return true end
    end

    return false
end

-- ============================================================
-- PUBLIC API
-- ============================================================

function Permissions.Init()
    -- Pre-resolve all roles
    for roleName in pairs(roles) do
        resolveRole(roleName)
    end

    -- Load admin identifiers from convars or config
    local adminJson = GetConvar('aw_admins', '{}')
    local ok, admins = pcall(json.decode, adminJson)
    if ok and type(admins) == 'table' then
        for identifier, role in pairs(admins) do
            if roles[role] then
                configuredAdmins[identifier] = role
            end
        end
    end

    CoreLogger.Info('permissions', 'Permission system initialized (%d roles, %d configured admins)', Utils.TableCount(roles), Utils.TableCount(configuredAdmins))
end

--- Determine the role for a player based on configured admin list
---@param identifiers table { license=..., steam=..., discord=... }
---@return string role
function Permissions.ResolvePlayerRole(identifiers)
    local bestRole = 'player'
    local bestWeight = roles['player'].weight

    for _, id in pairs(identifiers) do
        local role = configuredAdmins[id]
        if role and roles[role] and roles[role].weight > bestWeight then
            bestRole = role
            bestWeight = roles[role].weight
        end
    end

    return bestRole
end

--- Build the full permission node set for a player's role + any extra grants
---@param roleName string
---@param extraPerms table|nil Array of additional permission strings
---@return table<string,boolean>
function Permissions.BuildPlayerPermissions(roleName, extraPerms)
    local base = resolveRole(roleName) or {}
    local result = {}
    for k, v in pairs(base) do
        result[k] = v
    end
    if extraPerms then
        for _, perm in ipairs(extraPerms) do
            result[perm] = true
        end
    end
    return result
end

--- Check if a player has a specific permission
---@param awid string Player AWID
---@param permission string Permission node to check
---@return boolean
function Permissions.HasPermission(awid, permission)
    local player = CoreIdentity.Get(awid)
    if not player then return false end

    -- Superadmin bypasses everything
    if player.role == 'superadmin' then return true end

    return matchPermission(player.permissions, permission)
end

--- Check if a player has permission by serverId
---@param serverId number
---@param permission string
---@return boolean
function Permissions.HasPermissionByServerId(serverId, permission)
    local player = CoreIdentity.GetByServerId(serverId)
    if not player then return false end
    if player.role == 'superadmin' then return true end
    return matchPermission(player.permissions, permission)
end

--- Check if one role outranks another
---@param roleA string
---@param roleB string
---@return boolean true if roleA outranks roleB
function Permissions.Outranks(roleA, roleB)
    local a = roles[roleA]
    local b = roles[roleB]
    if not a or not b then return false end
    return a.weight > b.weight
end

--- Get a role's definition
---@param roleName string
---@return table|nil
function Permissions.GetRole(roleName)
    return roles[roleName]
end

--- Get all role names
---@return table
function Permissions.GetAllRoles()
    return Utils.TableKeys(roles)
end

--- Set a player's role at runtime (e.g., admin promotes)
---@param awid string
---@param newRole string
---@return boolean
function Permissions.SetPlayerRole(awid, newRole)
    if not roles[newRole] then return false end

    local player = CoreIdentity.Get(awid)
    if not player then return false end

    local oldRole = player.role
    player.role = newRole
    player.permissions = Permissions.BuildPlayerPermissions(newRole)
    CoreIdentity.MarkDirty(awid)

    CoreLogger.Info('permissions', 'Role changed: %s [%s → %s]', awid, oldRole, newRole)
    CoreEvents.Emit('Permission.RoleChanged', { awid = awid, oldRole = oldRole, newRole = newRole })

    return true
end

--- Grant an extra permission to a player (beyond their role)
---@param awid string
---@param permission string
---@return boolean
function Permissions.GrantPermission(awid, permission)
    local player = CoreIdentity.Get(awid)
    if not player then return false end

    player.permissions[permission] = true
    CoreLogger.Info('permissions', 'Granted %s to %s', permission, awid)
    return true
end

--- Revoke a permission from a player
---@param awid string
---@param permission string
---@return boolean
function Permissions.RevokePermission(awid, permission)
    local player = CoreIdentity.Get(awid)
    if not player then return false end

    player.permissions[permission] = nil
    CoreLogger.Info('permissions', 'Revoked %s from %s', permission, awid)
    return true
end

CorePermissions = Permissions
