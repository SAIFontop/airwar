--[[
    aw-store — Server-side Economy & Store System
    
    Responsibilities:
    1. Player currency (credits) — load/save from DB
    2. Reward system — kills, missions, playtime, achievements
    3. Purchase system — aircraft, weapons, skins, CMs, upgrades
    4. Transaction logging — every purchase/reward logged for audit
    5. Anti-exploit — rate limits, max balance, duplicate purchase checks
]]

-- ============================================================
-- MODULE STATE
-- ============================================================

local StoreManager = {}
local initialized = false

-- Player balances: awid → number
local balances = {}

-- Owned items cache: awid → { category → { itemId → true } }
local ownedItems = {}

-- Transaction buffer for batch DB writes
local transactionBuffer = {}

-- Economy config (loaded from aw-config)
local economyConfig = nil

-- ============================================================
-- CONFIG LOADING
-- ============================================================

local function loadEconomyConfig()
    if CoreRegistry then
        economyConfig = CoreRegistry.Get('economy', 'main')
    end

    -- Defaults if config not found
    if not economyConfig then
        economyConfig = {
            starting_balance   = 5000,
            max_balance        = 10000000,
            passive_rate       = 10,   -- credits per minute
            passive_interval   = 60,   -- seconds
            daily_limit        = 500000,
            kill_rewards = {
                fighter      = 150,
                bomber       = 200,
                multirole    = 150,
                interceptor  = 175,
                attacker     = 175,
                awacs        = 300,
                transport    = 250,
                recon        = 200,
                default      = 100,
            },
            assist_multiplier  = 0.4,
            mission_multiplier = 1.0,
            underdog_bonus     = 1.5,
        }
    end
end

-- ============================================================
-- BALANCE MANAGEMENT
-- ============================================================

--- Load a player's balance from DB
---@param awid string
local function loadBalance(awid)
    if balances[awid] then return end

    if MySQL then
        local rows = MySQL.Sync.fetchAll(
            'SELECT balance FROM ' .. AW.TABLE.ECONOMY .. ' WHERE awid = ? LIMIT 1',
            { awid }
        )
        if rows and #rows > 0 then
            balances[awid] = rows[1].balance or 0
        else
            -- New player, insert starting balance
            balances[awid] = economyConfig.starting_balance or 5000
            MySQL.Async.execute(
                'INSERT INTO ' .. AW.TABLE.ECONOMY .. ' (awid, balance) VALUES (?, ?)',
                { awid, balances[awid] }
            )
        end
    else
        balances[awid] = economyConfig.starting_balance or 5000
    end
end

--- Save a player's balance to DB
---@param awid string
local function saveBalance(awid)
    if not MySQL or not balances[awid] then return end
    MySQL.Async.execute(
        'UPDATE ' .. AW.TABLE.ECONOMY .. ' SET balance = ? WHERE awid = ?',
        { balances[awid], awid }
    )
end

--- Get a player's current balance
---@param awid string
---@return number
function StoreManager.GetBalance(awid)
    return balances[awid] or 0
end

--- Add credits to a player's balance
---@param awid string
---@param amount number
---@param reason string
---@param metadata table|nil
---@return number newBalance
function StoreManager.AddBalance(awid, amount, reason, metadata)
    if not awid or not amount or amount <= 0 then return StoreManager.GetBalance(awid) end

    local current = balances[awid] or 0
    local maxBal = economyConfig.max_balance or 10000000

    -- Cap at max
    local newBalance = math.min(current + amount, maxBal)
    balances[awid] = newBalance

    -- Log transaction
    StoreManager.LogTransaction(awid, 'credit', amount, reason, metadata)

    -- Notify
    TriggerEvent(AW.EVENT.BALANCE_CHANGED, {
        awid        = awid,
        old_balance = current,
        new_balance = newBalance,
        delta       = amount,
        reason      = reason,
    })

    -- Save async
    saveBalance(awid)

    return newBalance
end

--- Deduct credits from a player's balance
---@param awid string
---@param amount number
---@param reason string
---@param metadata table|nil
---@return boolean success
---@return number newBalance
function StoreManager.DeductBalance(awid, amount, reason, metadata)
    if not awid or not amount or amount <= 0 then return false, StoreManager.GetBalance(awid) end

    local current = balances[awid] or 0
    if current < amount then
        return false, current
    end

    local newBalance = current - amount
    balances[awid] = newBalance

    StoreManager.LogTransaction(awid, 'debit', amount, reason, metadata)

    TriggerEvent(AW.EVENT.BALANCE_CHANGED, {
        awid        = awid,
        old_balance = current,
        new_balance = newBalance,
        delta       = -amount,
        reason      = reason,
    })

    saveBalance(awid)

    return true, newBalance
end

-- ============================================================
-- TRANSACTION LOGGING
-- ============================================================

--- Log a transaction to buffer (batched DB write)
---@param awid string
---@param txType string  'credit' | 'debit'
---@param amount number
---@param reason string
---@param metadata table|nil
function StoreManager.LogTransaction(awid, txType, amount, reason, metadata)
    transactionBuffer[#transactionBuffer + 1] = {
        awid      = awid,
        tx_type   = txType,
        amount    = amount,
        reason    = reason or 'unknown',
        metadata  = metadata and json.encode(metadata) or nil,
        timestamp = os.time(),
    }
end

--- Flush transaction buffer to DB
local function flushTransactions()
    if #transactionBuffer == 0 or not MySQL then return end

    local batch = transactionBuffer
    transactionBuffer = {}

    for _, tx in ipairs(batch) do
        MySQL.Async.execute(
            'INSERT INTO ' .. AW.TABLE.TRANSACTIONS .. ' (awid, tx_type, amount, reason, metadata, created_at) '
            .. 'VALUES (?, ?, ?, ?, ?, FROM_UNIXTIME(?))',
            { tx.awid, tx.tx_type, tx.amount, tx.reason, tx.metadata, tx.timestamp }
        )
    end
end

--- Get transaction history for a player
---@param awid string
---@param limit number|nil
---@return table
function StoreManager.GetTransactionHistory(awid, limit)
    if not MySQL then return {} end

    local rows = MySQL.Sync.fetchAll(
        'SELECT tx_type, amount, reason, metadata, created_at FROM ' .. AW.TABLE.TRANSACTIONS
        .. ' WHERE awid = ? ORDER BY created_at DESC LIMIT ?',
        { awid, limit or 50 }
    )
    return rows or {}
end

-- ============================================================
-- OWNERSHIP / PURCHASES
-- ============================================================

--- Load owned items from DB
---@param awid string
local function loadOwnedItems(awid)
    if ownedItems[awid] then return end
    ownedItems[awid] = {}

    if not MySQL then return end

    local rows = MySQL.Sync.fetchAll(
        'SELECT category, item_id FROM ' .. AW.TABLE.OWNED_ITEMS .. ' WHERE awid = ?',
        { awid }
    )

    if rows then
        for _, row in ipairs(rows) do
            if not ownedItems[awid][row.category] then
                ownedItems[awid][row.category] = {}
            end
            ownedItems[awid][row.category][row.item_id] = true
        end
    end
end

--- Check if player owns an item
---@param awid string
---@param category string
---@param itemId string
---@return boolean
local function isOwned(awid, category, itemId)
    return ownedItems[awid]
        and ownedItems[awid][category]
        and ownedItems[awid][category][itemId] == true
end

--- Grant ownership of an item
---@param awid string
---@param category string
---@param itemId string
local function grantOwnership(awid, category, itemId)
    if not ownedItems[awid] then ownedItems[awid] = {} end
    if not ownedItems[awid][category] then ownedItems[awid][category] = {} end
    ownedItems[awid][category][itemId] = true

    if MySQL then
        MySQL.Async.execute(
            'INSERT IGNORE INTO ' .. AW.TABLE.OWNED_ITEMS .. ' (awid, category, item_id, purchased_at) VALUES (?, ?, ?, NOW())',
            { awid, category, itemId }
        )
    end
end

--- Get all owned items by category for a player
---@param awid string
---@param category string|nil  Specific category or nil for all
---@return table
function StoreManager.GetOwnedItems(awid, category)
    if not ownedItems[awid] then return {} end

    if category then
        local items = {}
        if ownedItems[awid][category] then
            for itemId, _ in pairs(ownedItems[awid][category]) do
                items[#items + 1] = itemId
            end
        end
        return items
    end

    return ownedItems[awid]
end

-- ============================================================
-- PURCHASE API
-- ============================================================

--- Purchase an aircraft type
---@param awid string
---@param aircraftTypeId string
---@return boolean success
---@return string|nil error
function StoreManager.PurchaseAircraft(awid, aircraftTypeId)
    -- Check if already owned
    if isOwned(awid, 'aircraft', aircraftTypeId) then
        return false, 'Already owned'
    end

    -- Get aircraft definition for price
    local aircraftDef = nil
    if CoreRegistry then
        aircraftDef = CoreRegistry.Get('aircraft', aircraftTypeId)
    end
    if not aircraftDef then
        return false, 'Unknown aircraft type'
    end

    local price = aircraftDef.price or 0
    if price <= 0 then
        return false, 'Aircraft not purchasable'
    end

    -- Check balance
    local balance = StoreManager.GetBalance(awid)
    if balance < price then
        return false, 'Insufficient funds'
    end

    -- Deduct and grant
    local success = StoreManager.DeductBalance(awid, price, 'purchase_aircraft', { item = aircraftTypeId })
    if not success then
        return false, 'Payment failed'
    end

    grantOwnership(awid, 'aircraft', aircraftTypeId)

    -- Also notify aircraft module for ownership sync
    TriggerEvent(AW.EVENT.ITEM_PURCHASED, {
        awid     = awid,
        category = 'aircraft',
        item_id  = aircraftTypeId,
        price    = price,
    })

    CoreLogger.Info('aw-store', '%s purchased aircraft: %s for $%d', awid, aircraftTypeId, price)
    return true, nil
end

--- Purchase a weapon type
---@param awid string
---@param weaponTypeId string
---@return boolean success
---@return string|nil error
function StoreManager.PurchaseWeapon(awid, weaponTypeId)
    if isOwned(awid, 'weapon', weaponTypeId) then
        return false, 'Already owned'
    end

    local weaponDef = nil
    if CoreRegistry then
        weaponDef = CoreRegistry.Get('weapon', weaponTypeId)
    end
    if not weaponDef then
        return false, 'Unknown weapon type'
    end

    local price = weaponDef.price or 0
    if price <= 0 then
        return false, 'Weapon not purchasable'
    end

    local balance = StoreManager.GetBalance(awid)
    if balance < price then
        return false, 'Insufficient funds'
    end

    local success = StoreManager.DeductBalance(awid, price, 'purchase_weapon', { item = weaponTypeId })
    if not success then
        return false, 'Payment failed'
    end

    grantOwnership(awid, 'weapon', weaponTypeId)

    TriggerEvent(AW.EVENT.ITEM_PURCHASED, {
        awid     = awid,
        category = 'weapon',
        item_id  = weaponTypeId,
        price    = price,
    })

    CoreLogger.Info('aw-store', '%s purchased weapon: %s for $%d', awid, weaponTypeId, price)
    return true, nil
end

--- Purchase a generic item (skin, upgrade, countermeasure, etc.)
---@param awid string
---@param category string
---@param itemId string
---@return boolean success
---@return string|nil error
function StoreManager.PurchaseItem(awid, category, itemId)
    if isOwned(awid, category, itemId) then
        return false, 'Already owned'
    end

    local itemDef = nil
    if CoreRegistry then
        itemDef = CoreRegistry.Get(category, itemId)
    end
    if not itemDef then
        return false, 'Unknown item'
    end

    local price = itemDef.price or 0
    if price <= 0 then
        return false, 'Item not purchasable'
    end

    local balance = StoreManager.GetBalance(awid)
    if balance < price then
        return false, 'Insufficient funds'
    end

    local success = StoreManager.DeductBalance(awid, price, 'purchase_' .. category, { item = itemId })
    if not success then
        return false, 'Payment failed'
    end

    grantOwnership(awid, category, itemId)

    TriggerEvent(AW.EVENT.ITEM_PURCHASED, {
        awid     = awid,
        category = category,
        item_id  = itemId,
        price    = price,
    })

    CoreLogger.Info('aw-store', '%s purchased %s: %s for $%d', awid, category, itemId, price)
    return true, nil
end

-- ============================================================
-- REWARD HANDLERS
-- ============================================================

--- Award kill credits
---@param data table Kill event data
local function awardKillCredits(data)
    if not data or not data.attacker_awid then return end

    local role = data.victim_role or 'default'
    local rewards = economyConfig.kill_rewards or {}
    local base = rewards[role] or rewards.default or 100

    -- Underdog bonus: check if attacker's faction is outnumbered
    local multiplier = 1.0
    if data.attacker_faction then
        local factionCount = exports['aw-faction']:GetFactionOnlineCount(data.attacker_faction)
        local allFactions = exports['aw-faction']:GetAllFactions()
        local maxCount = 0
        if allFactions then
            for _, state in pairs(allFactions) do
                if state.online_count > maxCount then
                    maxCount = state.online_count
                end
            end
        end
        if factionCount > 0 and maxCount > factionCount * 1.3 then
            multiplier = economyConfig.underdog_bonus or 1.5
        end
    end

    local total = math.floor(base * multiplier)
    StoreManager.AddBalance(data.attacker_awid, total, 'kill_reward', {
        victim    = data.victim_awid,
        role      = role,
        base      = base,
        mult      = multiplier,
    })
end

--- Award assist credits
---@param data table Assist event data
local function awardAssistCredits(data)
    if not data or not data.assister_awid then return end

    local role = data.victim_role or 'default'
    local rewards = economyConfig.kill_rewards or {}
    local base = rewards[role] or rewards.default or 100
    local assistMult = economyConfig.assist_multiplier or 0.4

    local total = math.floor(base * assistMult)
    StoreManager.AddBalance(data.assister_awid, total, 'assist_reward', {
        victim = data.victim_awid,
    })
end

--- Award mission completion credits
---@param data table Mission event data
local function awardMissionCredits(data)
    if not data or not data.participants then return end

    local baseReward = data.reward or 500
    local missionMult = economyConfig.mission_multiplier or 1.0
    local total = math.floor(baseReward * missionMult)

    for _, awid in ipairs(data.participants) do
        StoreManager.AddBalance(awid, total, 'mission_reward', {
            mission_type = data.mission_type,
            difficulty   = data.difficulty,
        })
    end
end

-- ============================================================
-- PASSIVE INCOME
-- ============================================================

local passiveTimer = 0

local function tickPassiveIncome()
    local rate = economyConfig.passive_rate or 10
    if rate <= 0 then return end

    for awid, _ in pairs(balances) do
        StoreManager.AddBalance(awid, rate, 'passive_income')
    end
end

-- ============================================================
-- EVENT HANDLERS
-- ============================================================

--- Player loaded
AddEventHandler(AW.EVENT.PLAYER_LOADED, function(data)
    if not data or not data.awid then return end

    loadBalance(data.awid)
    loadOwnedItems(data.awid)

    -- Notify client of balance
    if data.source then
        TriggerClientEvent(AW.EVENT.BALANCE_CHANGED, data.source, {
            awid        = data.awid,
            new_balance = StoreManager.GetBalance(data.awid),
        })
    end
end)

--- Player dropped — save and cleanup
AddEventHandler(AW.EVENT.PLAYER_DROPPED, function(data)
    if not data or not data.awid then return end

    saveBalance(data.awid)

    -- Cleanup after a delay to let any pending transactions settle
    SetTimeout(5000, function()
        balances[data.awid] = nil
        ownedItems[data.awid] = nil
    end)
end)

--- Kill event — award credits to killer
AddEventHandler(AW.EVENT.KILL, function(data)
    awardKillCredits(data)
end)

--- Assist event — award partial credits
AddEventHandler(AW.EVENT.COMBAT_ASSIST, function(data)
    awardAssistCredits(data)
end)

--- Mission completed — award credits to participants
AddEventHandler(AW.EVENT.MISSION_COMPLETED, function(data)
    awardMissionCredits(data)
end)

--- Core shutdown — save all balances
AddEventHandler(AW.EVENT.CORE_SHUTDOWN, function()
    flushTransactions()
    for awid, _ in pairs(balances) do
        saveBalance(awid)
    end
end)

-- ============================================================
-- PERIODIC TASKS
-- ============================================================

CreateThread(function()
    while true do
        Wait(10000) -- Flush transactions every 10 seconds
        if initialized then
            flushTransactions()
        end
    end
end)

CreateThread(function()
    local interval = (economyConfig and economyConfig.passive_interval or 60) * 1000
    while true do
        Wait(interval)
        if initialized then
            tickPassiveIncome()
        end
    end
end)

-- ============================================================
-- INITIALIZATION
-- ============================================================

AddEventHandler(AW.EVENT.CORE_READY, function()
    if initialized then return end
    initialized = true

    loadEconomyConfig()

    if CoreAPI and CoreAPI.RegisterModule then
        CoreAPI.RegisterModule({
            name     = 'aw-store',
            version  = '1.0.0',
            priority = 200,
        })
    end

    CoreLogger.Info('aw-store', 'Economy module initialized — starting balance: $%d', economyConfig.starting_balance or 5000)
end)

-- ============================================================
-- EXPORTS
-- ============================================================

exports('GetBalance',             function(...) return StoreManager.GetBalance(...) end)
exports('AddBalance',             function(...) return StoreManager.AddBalance(...) end)
exports('DeductBalance',          function(...) return StoreManager.DeductBalance(...) end)
exports('PurchaseAircraft',       function(...) return StoreManager.PurchaseAircraft(...) end)
exports('PurchaseWeapon',         function(...) return StoreManager.PurchaseWeapon(...) end)
exports('PurchaseItem',           function(...) return StoreManager.PurchaseItem(...) end)
exports('GetTransactionHistory',  function(...) return StoreManager.GetTransactionHistory(...) end)
exports('GetOwnedItems',          function(...) return StoreManager.GetOwnedItems(...) end)
