-- ═══════════════════════════════════════════════════════════
-- Client State (StateBag reader)
-- ═══════════════════════════════════════════════════════════

Core.State = {}

function Core.State.Get(key)
    return GlobalState[key]
end

function Core.State.GetLocal(key)
    return LocalPlayer.state[key]
end

function Core.State.OnChange(key, fn)
    AddStateBagChangeHandler(key, nil, function(bagName, _key, value)
        fn(bagName, value)
    end)
end
