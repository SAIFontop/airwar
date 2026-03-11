--[[
    System 2: Database
    oxmysql abstraction, migration system, query builder, write-behind
]]

local Database = {}
Database.__index = Database

local isReady = false
local migrationVersion = 0

-- ============================================================
-- INITIALIZATION
-- ============================================================

function Database.Init()
    CoreLogger.Info('database', 'Database system initializing...')

    -- Create migrations table if not exists
    MySQL.Sync.execute([[
        CREATE TABLE IF NOT EXISTS ]] .. AW.TABLE.MIGRATIONS .. [[ (
            version INT NOT NULL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ]])

    -- Get current migration version
    local rows = MySQL.Sync.fetchAll('SELECT MAX(version) as v FROM ' .. AW.TABLE.MIGRATIONS)
    migrationVersion = (rows and rows[1] and rows[1].v) or 0
    CoreLogger.Info('database', 'Current migration version: %d', migrationVersion)

    -- Run pending migrations
    Database.RunMigrations()

    isReady = true
    CoreLogger.Info('database', 'Database system ready')
end

-- ============================================================
-- MIGRATION SYSTEM
-- ============================================================

local migrations = {}

--- Register a migration
---@param version number
---@param name string
---@param up function
---@param down function|nil
function Database.RegisterMigration(version, name, up, down)
    migrations[version] = { version = version, name = name, up = up, down = down }
end

--- Run all pending migrations
function Database.RunMigrations()
    local sorted = {}
    for v, m in pairs(migrations) do
        if v > migrationVersion then
            sorted[#sorted + 1] = m
        end
    end
    table.sort(sorted, function(a, b) return a.version < b.version end)

    for _, m in ipairs(sorted) do
        CoreLogger.Info('database', 'Running migration %d: %s', m.version, m.name)
        local ok, err = pcall(m.up)
        if ok then
            MySQL.Sync.execute(
                'INSERT INTO ' .. AW.TABLE.MIGRATIONS .. ' (version, name) VALUES (?, ?)',
                { m.version, m.name }
            )
            migrationVersion = m.version
            CoreLogger.Info('database', 'Migration %d applied successfully', m.version)
        else
            CoreLogger.Fatal('database', 'Migration %d FAILED: %s', m.version, tostring(err))
            error('Migration failed — server cannot continue')
        end
    end
end

-- ============================================================
-- REGISTER INITIAL MIGRATION
-- ============================================================

Database.RegisterMigration(1, 'initial_schema', function()
    -- Players table
    MySQL.Sync.execute([[
        CREATE TABLE IF NOT EXISTS ]] .. AW.TABLE.PLAYERS .. [[ (
            awid VARCHAR(12) NOT NULL PRIMARY KEY,
            license VARCHAR(64) NOT NULL UNIQUE,
            steam VARCHAR(64) DEFAULT NULL,
            discord VARCHAR(64) DEFAULT NULL,
            name VARCHAR(64) NOT NULL DEFAULT 'Unknown',
            callsign VARCHAR(16) DEFAULT NULL,
            faction_id VARCHAR(32) DEFAULT NULL,
            role VARCHAR(32) NOT NULL DEFAULT 'player',
            first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            banned TINYINT(1) NOT NULL DEFAULT 0,
            INDEX idx_license (license),
            INDEX idx_faction (faction_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ]])

    -- Player flexible KV data
    MySQL.Sync.execute([[
        CREATE TABLE IF NOT EXISTS ]] .. AW.TABLE.PLAYER_DATA .. [[ (
            awid VARCHAR(12) NOT NULL,
            data_key VARCHAR(64) NOT NULL,
            data_value TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (awid, data_key),
            FOREIGN KEY (awid) REFERENCES ]] .. AW.TABLE.PLAYERS .. [[(awid) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ]])

    -- Sessions
    MySQL.Sync.execute([[
        CREATE TABLE IF NOT EXISTS ]] .. AW.TABLE.SESSIONS .. [[ (
            session_id VARCHAR(14) NOT NULL PRIMARY KEY,
            awid VARCHAR(12) NOT NULL,
            ip_hash VARCHAR(64) NOT NULL,
            connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            disconnected_at TIMESTAMP NULL,
            duration_seconds INT DEFAULT 0,
            FOREIGN KEY (awid) REFERENCES ]] .. AW.TABLE.PLAYERS .. [[(awid) ON DELETE CASCADE,
            INDEX idx_awid (awid)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ]])

    -- Stats
    MySQL.Sync.execute([[
        CREATE TABLE IF NOT EXISTS ]] .. AW.TABLE.STATS .. [[ (
            awid VARCHAR(12) NOT NULL PRIMARY KEY,
            kills INT NOT NULL DEFAULT 0,
            deaths INT NOT NULL DEFAULT 0,
            assists INT NOT NULL DEFAULT 0,
            sorties INT NOT NULL DEFAULT 0,
            flight_time_seconds INT NOT NULL DEFAULT 0,
            missiles_fired INT NOT NULL DEFAULT 0,
            missiles_hit INT NOT NULL DEFAULT 0,
            gun_rounds_fired INT NOT NULL DEFAULT 0,
            gun_rounds_hit INT NOT NULL DEFAULT 0,
            damage_dealt DOUBLE NOT NULL DEFAULT 0,
            damage_taken DOUBLE NOT NULL DEFAULT 0,
            missions_completed INT NOT NULL DEFAULT 0,
            missions_failed INT NOT NULL DEFAULT 0,
            money_earned BIGINT NOT NULL DEFAULT 0,
            money_spent BIGINT NOT NULL DEFAULT 0,
            FOREIGN KEY (awid) REFERENCES ]] .. AW.TABLE.PLAYERS .. [[(awid) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ]])

    -- Rankings
    MySQL.Sync.execute([[
        CREATE TABLE IF NOT EXISTS ]] .. AW.TABLE.RANKINGS .. [[ (
            awid VARCHAR(12) NOT NULL PRIMARY KEY,
            rank_name VARCHAR(32) NOT NULL DEFAULT 'Recruit',
            rank_tier INT NOT NULL DEFAULT 0,
            xp BIGINT NOT NULL DEFAULT 0,
            season_xp BIGINT NOT NULL DEFAULT 0,
            FOREIGN KEY (awid) REFERENCES ]] .. AW.TABLE.PLAYERS .. [[(awid) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ]])

    -- Ownership
    MySQL.Sync.execute([[
        CREATE TABLE IF NOT EXISTS ]] .. AW.TABLE.OWNERSHIP .. [[ (
            id INT AUTO_INCREMENT PRIMARY KEY,
            awid VARCHAR(12) NOT NULL,
            item_type VARCHAR(32) NOT NULL,
            item_id VARCHAR(64) NOT NULL,
            acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT DEFAULT NULL,
            UNIQUE KEY uk_ownership (awid, item_type, item_id),
            FOREIGN KEY (awid) REFERENCES ]] .. AW.TABLE.PLAYERS .. [[(awid) ON DELETE CASCADE,
            INDEX idx_awid_type (awid, item_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ]])

    -- Inventory
    MySQL.Sync.execute([[
        CREATE TABLE IF NOT EXISTS ]] .. AW.TABLE.INVENTORY .. [[ (
            awid VARCHAR(12) NOT NULL,
            item_type VARCHAR(32) NOT NULL,
            item_id VARCHAR(64) NOT NULL,
            quantity INT NOT NULL DEFAULT 0,
            PRIMARY KEY (awid, item_type, item_id),
            FOREIGN KEY (awid) REFERENCES ]] .. AW.TABLE.PLAYERS .. [[(awid) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ]])

    -- Factions data
    MySQL.Sync.execute([[
        CREATE TABLE IF NOT EXISTS ]] .. AW.TABLE.FACTIONS_DATA .. [[ (
            faction_id VARCHAR(32) NOT NULL PRIMARY KEY,
            total_kills INT NOT NULL DEFAULT 0,
            total_deaths INT NOT NULL DEFAULT 0,
            total_score BIGINT NOT NULL DEFAULT 0,
            zones_held INT NOT NULL DEFAULT 0,
            wars_won INT NOT NULL DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ]])

    -- Bans
    MySQL.Sync.execute([[
        CREATE TABLE IF NOT EXISTS ]] .. AW.TABLE.BANS .. [[ (
            id INT AUTO_INCREMENT PRIMARY KEY,
            awid VARCHAR(12) NOT NULL,
            banned_by VARCHAR(12) DEFAULT NULL,
            reason TEXT NOT NULL,
            banned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NULL,
            active TINYINT(1) NOT NULL DEFAULT 1,
            FOREIGN KEY (awid) REFERENCES ]] .. AW.TABLE.PLAYERS .. [[(awid) ON DELETE CASCADE,
            INDEX idx_active (awid, active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ]])

    -- Logs
    MySQL.Sync.execute([[
        CREATE TABLE IF NOT EXISTS ]] .. AW.TABLE.LOGS .. [[ (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            level VARCHAR(8) NOT NULL,
            source VARCHAR(64) NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_level (level),
            INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ]])

    -- Missions history
    MySQL.Sync.execute([[
        CREATE TABLE IF NOT EXISTS ]] .. AW.TABLE.MISSIONS_HISTORY .. [[ (
            mission_id VARCHAR(14) NOT NULL PRIMARY KEY,
            mission_type VARCHAR(64) NOT NULL,
            faction_id VARCHAR(32) DEFAULT NULL,
            status VARCHAR(16) NOT NULL DEFAULT 'active',
            participants TEXT DEFAULT NULL,
            score INT NOT NULL DEFAULT 0,
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ended_at TIMESTAMP NULL,
            metadata TEXT DEFAULT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ]])

    -- World state
    MySQL.Sync.execute([[
        CREATE TABLE IF NOT EXISTS ]] .. AW.TABLE.WORLD_STATE .. [[ (
            zone_id VARCHAR(64) NOT NULL PRIMARY KEY,
            owner_faction VARCHAR(32) DEFAULT NULL,
            status VARCHAR(16) NOT NULL DEFAULT 'neutral',
            capture_progress FLOAT NOT NULL DEFAULT 0,
            last_changed TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ]])

    -- Kill log
    MySQL.Sync.execute([[
        CREATE TABLE IF NOT EXISTS ]] .. AW.TABLE.KILL_LOG .. [[ (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            killer_awid VARCHAR(12) NOT NULL,
            victim_awid VARCHAR(12) NOT NULL,
            killer_aircraft VARCHAR(64) DEFAULT NULL,
            victim_aircraft VARCHAR(64) DEFAULT NULL,
            weapon VARCHAR(64) DEFAULT NULL,
            distance FLOAT DEFAULT NULL,
            killer_faction VARCHAR(32) DEFAULT NULL,
            victim_faction VARCHAR(32) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_killer (killer_awid),
            INDEX idx_victim (victim_awid),
            INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ]])
end, function()
    -- Rollback: drop all tables in reverse dependency order
    local tables = {
        AW.TABLE.KILL_LOG, AW.TABLE.WORLD_STATE, AW.TABLE.MISSIONS_HISTORY,
        AW.TABLE.LOGS, AW.TABLE.BANS, AW.TABLE.FACTIONS_DATA,
        AW.TABLE.INVENTORY, AW.TABLE.OWNERSHIP, AW.TABLE.RANKINGS,
        AW.TABLE.STATS, AW.TABLE.SESSIONS, AW.TABLE.PLAYER_DATA,
        AW.TABLE.PLAYERS, AW.TABLE.MIGRATIONS,
    }
    for _, t in ipairs(tables) do
        MySQL.Sync.execute('DROP TABLE IF EXISTS ' .. t)
    end
end)

-- ============================================================
-- QUERY BUILDER
-- ============================================================

local QueryBuilder = {}
QueryBuilder.__index = QueryBuilder

---@param tableName string
---@return table
function Database.Table(tableName)
    local qb = setmetatable({}, QueryBuilder)
    qb._table = tableName
    return qb
end

--- Find a single row
---@param where table { column = value, ... }
---@return table|nil
function QueryBuilder:find(where)
    local conditions = {}
    local params = {}
    for col, val in pairs(where) do
        conditions[#conditions + 1] = col .. ' = ?'
        params[#params + 1] = val
    end
    local sql = 'SELECT * FROM ' .. self._table .. ' WHERE ' .. table.concat(conditions, ' AND ') .. ' LIMIT 1'
    local rows = MySQL.Sync.fetchAll(sql, params)
    return rows and rows[1] or nil
end

--- Find all matching rows
---@param where table|nil
---@param orderBy string|nil
---@param limit number|nil
---@return table
function QueryBuilder:findAll(where, orderBy, limit)
    local sql = 'SELECT * FROM ' .. self._table
    local params = {}

    if where and next(where) then
        local conditions = {}
        for col, val in pairs(where) do
            conditions[#conditions + 1] = col .. ' = ?'
            params[#params + 1] = val
        end
        sql = sql .. ' WHERE ' .. table.concat(conditions, ' AND ')
    end

    if orderBy then sql = sql .. ' ORDER BY ' .. orderBy end
    if limit then sql = sql .. ' LIMIT ' .. tonumber(limit) end

    return MySQL.Sync.fetchAll(sql, params) or {}
end

--- Insert a row
---@param data table { column = value, ... }
---@return number|nil insertId
function QueryBuilder:insert(data)
    local cols = {}
    local placeholders = {}
    local params = {}

    for col, val in pairs(data) do
        cols[#cols + 1] = col
        placeholders[#placeholders + 1] = '?'
        params[#params + 1] = val
    end

    local sql = 'INSERT INTO ' .. self._table .. ' (' .. table.concat(cols, ', ') .. ') VALUES (' .. table.concat(placeholders, ', ') .. ')'
    return MySQL.Sync.insert(sql, params)
end

--- Update rows
---@param where table
---@param data table { column = new_value, ... }
---@return number affectedRows
function QueryBuilder:update(where, data)
    local setClauses = {}
    local params = {}

    for col, val in pairs(data) do
        setClauses[#setClauses + 1] = col .. ' = ?'
        params[#params + 1] = val
    end

    local conditions = {}
    for col, val in pairs(where) do
        conditions[#conditions + 1] = col .. ' = ?'
        params[#params + 1] = val
    end

    local sql = 'UPDATE ' .. self._table .. ' SET ' .. table.concat(setClauses, ', ') .. ' WHERE ' .. table.concat(conditions, ' AND ')
    return MySQL.Sync.execute(sql, params)
end

--- Delete rows
---@param where table
---@return number affectedRows
function QueryBuilder:delete(where)
    local conditions = {}
    local params = {}

    for col, val in pairs(where) do
        conditions[#conditions + 1] = col .. ' = ?'
        params[#params + 1] = val
    end

    local sql = 'DELETE FROM ' .. self._table .. ' WHERE ' .. table.concat(conditions, ' AND ')
    return MySQL.Sync.execute(sql, params)
end

--- Increment a numeric column
---@param where table
---@param column string
---@param amount number
---@return number affectedRows
function QueryBuilder:increment(where, column, amount)
    amount = amount or 1
    local conditions = {}
    local params = { amount }

    for col, val in pairs(where) do
        conditions[#conditions + 1] = col .. ' = ?'
        params[#params + 1] = val
    end

    local sql = 'UPDATE ' .. self._table .. ' SET ' .. column .. ' = ' .. column .. ' + ? WHERE ' .. table.concat(conditions, ' AND ')
    return MySQL.Sync.execute(sql, params)
end

-- ============================================================
-- WRITE-BEHIND QUEUE
-- ============================================================

local writeBehindQueue = {}

--- Queue a write-behind operation
---@param tableName string
---@param where table
---@param data table
function Database.QueueWrite(tableName, where, data)
    local key = tableName .. ':' .. json.encode(where)
    if writeBehindQueue[key] then
        -- Merge new data into existing queued write
        for col, val in pairs(data) do
            writeBehindQueue[key].data[col] = val
        end
    else
        writeBehindQueue[key] = { table = tableName, where = where, data = data }
    end
end

--- Flush all queued writes to database
function Database.FlushWriteBehind()
    local count = 0
    for key, op in pairs(writeBehindQueue) do
        local ok, err = pcall(function()
            Database.Table(op.table):update(op.where, op.data)
        end)
        if not ok then
            CoreLogger.Error('database', 'Write-behind flush failed for %s: %s', op.table, tostring(err))
        end
        count = count + 1
    end
    writeBehindQueue = {}
    if count > 0 then
        CoreLogger.Debug('database', 'Flushed %d write-behind operations', count)
    end
end

--- Flush writes for a specific player (on disconnect)
---@param awid string
function Database.FlushPlayer(awid)
    for key, op in pairs(writeBehindQueue) do
        if op.where.awid == awid then
            local ok, err = pcall(function()
                Database.Table(op.table):update(op.where, op.data)
            end)
            if not ok then
                CoreLogger.Error('database', 'Player flush failed for %s: %s', awid, tostring(err))
            end
            writeBehindQueue[key] = nil
        end
    end
end

--- Get status
function Database.IsReady() return isReady end
function Database.GetMigrationVersion() return migrationVersion end
function Database.GetWriteBehindCount()
    local count = 0
    for _ in pairs(writeBehindQueue) do count = count + 1 end
    return count
end

CoreDatabase = Database
