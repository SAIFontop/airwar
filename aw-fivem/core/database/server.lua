-- ═══════════════════════════════════════════════════════════
-- System 4: Database Layer (oxmysql abstraction)
-- ═══════════════════════════════════════════════════════════

Core.DB = {}

local _ready = false

function Core.DB.Query(query, params)
    if not MySQL then return nil end
    local p = promise.new()
    MySQL.query(query, params or {}, function(result)
        p:resolve(result)
    end)
    return Citizen.Await(p)
end

function Core.DB.Insert(query, params)
    if not MySQL then return nil end
    local p = promise.new()
    MySQL.insert(query, params or {}, function(id)
        p:resolve(id)
    end)
    return Citizen.Await(p)
end

function Core.DB.Update(query, params)
    if not MySQL then return 0 end
    local p = promise.new()
    MySQL.update(query, params or {}, function(affected)
        p:resolve(affected)
    end)
    return Citizen.Await(p)
end

function Core.DB.Delete(query, params)
    return Core.DB.Update(query, params)
end

function Core.DB.Scalar(query, params)
    if not MySQL then return nil end
    local p = promise.new()
    MySQL.scalar(query, params or {}, function(value)
        p:resolve(value)
    end)
    return Citizen.Await(p)
end

function Core.DB.Execute(query, params)
    if not MySQL then return nil end
    MySQL.query(query, params or {})
end

function Core.DB.Ready()
    return _ready
end

function Core.DB._init()
    if not MySQL then
        Core.Log.Warn('db', 'oxmysql not found — database disabled')
        return
    end

    Core.DB.Execute([[
        CREATE TABLE IF NOT EXISTS ]] .. AW.TABLE.PLAYERS .. [[ (
            id INT AUTO_INCREMENT PRIMARY KEY,
            identifier VARCHAR(100) NOT NULL UNIQUE,
            name VARCHAR(64) NOT NULL DEFAULT 'Unknown',
            rank VARCHAR(20) NOT NULL DEFAULT 'user',
            first_join DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_seen DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            play_time INT NOT NULL DEFAULT 0,
            data JSON DEFAULT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ]])

    -- Migrate: add missing columns to existing tables
    local migrations = {
        { AW.TABLE.PLAYERS, 'rank',      "ALTER TABLE %s ADD COLUMN rank VARCHAR(20) NOT NULL DEFAULT 'user' AFTER name" },
        { AW.TABLE.PLAYERS, 'first_join', "ALTER TABLE %s ADD COLUMN first_join DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER rank" },
        { AW.TABLE.PLAYERS, 'last_seen',  "ALTER TABLE %s ADD COLUMN last_seen DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER first_join" },
        { AW.TABLE.PLAYERS, 'play_time',  "ALTER TABLE %s ADD COLUMN play_time INT NOT NULL DEFAULT 0 AFTER last_seen" },
        { AW.TABLE.PLAYERS, 'data',       "ALTER TABLE %s ADD COLUMN data JSON DEFAULT NULL AFTER play_time" },
    }
    for _, m in ipairs(migrations) do
        local exists = Core.DB.Scalar(
            "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
            { m[1], m[2] }
        )
        if exists == 0 then
            Core.DB.Execute(string.format(m[3], m[1]))
            Core.Log.Info('db', 'Added column %s.%s', m[1], m[2])
        end
    end

    Core.DB.Execute([[
        CREATE TABLE IF NOT EXISTS ]] .. AW.TABLE.PERMISSIONS .. [[ (
            id INT AUTO_INCREMENT PRIMARY KEY,
            identifier VARCHAR(100) NOT NULL,
            permission VARCHAR(100) NOT NULL,
            granted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_perm (identifier, permission)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ]])

    Core.DB.Execute([[
        CREATE TABLE IF NOT EXISTS ]] .. AW.TABLE.LOGS .. [[ (
            id INT AUTO_INCREMENT PRIMARY KEY,
            type VARCHAR(20) NOT NULL DEFAULT 'system',
            source VARCHAR(100) DEFAULT NULL,
            message TEXT NOT NULL,
            data JSON DEFAULT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_type (type),
            INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ]])

    _ready = true
    Core.Log.Info('db', 'Database initialized — tables verified')
end
