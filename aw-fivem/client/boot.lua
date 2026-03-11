-- ═══════════════════════════════════════════════════════════
-- Client Boot
-- ═══════════════════════════════════════════════════════════

CreateThread(function()
    while not Core.Events do Wait(10) end

    Core._ready = true
    Core.Events.Emit('core:ready')

    -- ESC closes focused UI
    CreateThread(function()
        while true do
            Wait(0)
            if Core.UI.IsFocused() then
                DisableControlAction(0, 200, true) -- ESC
                if IsDisabledControlJustPressed(0, 200) then
                    Core.UI.Close()
                end
            end
        end
    end)
end)
