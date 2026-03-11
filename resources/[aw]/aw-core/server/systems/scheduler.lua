--[[
    System 11: Scheduler
    Delayed and repeating tasks with unique IDs
]]

local Scheduler = {}
Scheduler.__index = Scheduler

local tasks = {}      -- All active tasks { [id] = task }
local nextId = 1

-- ============================================================
-- CORE API
-- ============================================================

--- Initialize the scheduler
function Scheduler.Init()
    CoreLogger.Info('scheduler', 'Scheduler system initialized')
end

--- Schedule a one-time delayed task
---@param delay number Delay in milliseconds
---@param callback function
---@param label string|nil Optional label for debugging
---@return number Task ID
function Scheduler.Once(delay, callback, label)
    local id = nextId
    nextId = nextId + 1

    tasks[id] = {
        id = id,
        label = label or ('task_' .. id),
        callback = callback,
        nextRun = GetGameTimer() + delay,
        interval = nil,
        repeating = false,
        cancelled = false,
    }

    CoreLogger.Debug('scheduler', 'Scheduled once [%d] "%s" in %dms', id, tasks[id].label, delay)
    return id
end

--- Schedule a repeating task
---@param interval number Interval in milliseconds
---@param callback function
---@param label string|nil Optional label
---@param immediate boolean|nil Run immediately on first tick?
---@return number Task ID
function Scheduler.Repeat(interval, callback, label, immediate)
    local id = nextId
    nextId = nextId + 1

    local now = GetGameTimer()
    tasks[id] = {
        id = id,
        label = label or ('repeat_' .. id),
        callback = callback,
        nextRun = immediate and now or (now + interval),
        interval = interval,
        repeating = true,
        cancelled = false,
    }

    CoreLogger.Debug('scheduler', 'Scheduled repeat [%d] "%s" every %dms', id, tasks[id].label, interval)
    return id
end

--- Cancel a scheduled task
---@param id number Task ID
function Scheduler.Cancel(id)
    if tasks[id] then
        tasks[id].cancelled = true
        CoreLogger.Debug('scheduler', 'Cancelled task [%d] "%s"', id, tasks[id].label)
        tasks[id] = nil
    end
end

--- Get count of active tasks
---@return number
function Scheduler.GetActiveCount()
    local count = 0
    for _ in pairs(tasks) do count = count + 1 end
    return count
end

--- Get info about scheduled tasks (for debug/admin)
---@return table
function Scheduler.GetTaskInfo()
    local info = {}
    for id, task in pairs(tasks) do
        info[#info + 1] = {
            id = id,
            label = task.label,
            repeating = task.repeating,
            interval = task.interval,
            nextRun = task.nextRun,
        }
    end
    return info
end

-- ============================================================
-- TICK LOOP
-- ============================================================

--- Process all tasks (called from main tick)
function Scheduler.Tick()
    local now = GetGameTimer()

    for id, task in pairs(tasks) do
        if not task.cancelled and now >= task.nextRun then
            local ok, err = pcall(task.callback)
            if not ok then
                CoreLogger.Error('scheduler', 'Task [%d] "%s" error: %s', id, task.label, tostring(err))
            end

            if task.repeating and not task.cancelled then
                task.nextRun = now + task.interval
            else
                tasks[id] = nil
            end
        end
    end
end

--- Cancel all tasks (for shutdown)
function Scheduler.CancelAll()
    local count = 0
    for id in pairs(tasks) do
        tasks[id] = nil
        count = count + 1
    end
    CoreLogger.Info('scheduler', 'Cancelled all %d tasks', count)
end

-- Main scheduler thread
CreateThread(function()
    while true do
        Scheduler.Tick()
        Wait(0)
    end
end)

CoreScheduler = Scheduler
