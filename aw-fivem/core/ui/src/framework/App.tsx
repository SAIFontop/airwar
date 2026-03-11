import { useEffect } from 'react'
import Dialog from '../dialogs/Dialog'
import AircraftStatus from '../hud/AircraftStatus'
import HUD from '../hud/HUD'
import KillFeed from '../hud/KillFeed'
import Warning from '../hud/Warning'
import Loadout from '../loadout/Loadout'
import Match from '../match/Match'
import ContextMenu from '../menus/ContextMenu'
import Menu from '../menus/Menu'
import Modal from '../modals/Modal'
import Notifications from '../notifications/Notifications'
import Progress from '../progress/Progress'
import Radar from '../radar/Radar'
import Scoreboard from '../scoreboard/Scoreboard'
import { fetchNUI, onNUI } from './nui'
import { useStore } from './store'

export default function App() {
    const store = useStore()

    useEffect(() => {
        onNUI('notification', (data) => useStore.getState().addNotification(data))
        onNUI('modal', (data) => useStore.getState().openModal(data))
        onNUI('modal:close', () => useStore.getState().closeModal())
        onNUI('menu:open', (data) => useStore.getState().openMenu(data.title, data.items))
        onNUI('menu:close', () => useStore.getState().closeMenu())
        onNUI('context:open', (data) => useStore.getState().openContext(data.x, data.y, data.items))
        onNUI('context:close', () => useStore.getState().closeContext())
        onNUI('dialog:open', (data) => useStore.getState().openDialog(data.title, data.fields))
        onNUI('dialog:close', () => useStore.getState().closeDialog())
        onNUI('progress', (data) => data ? useStore.getState().showProgress(data) : useStore.getState().hideProgress())
        onNUI('hud', (data) => useStore.getState().setHUD(data))
        onNUI('hud:visible', (data) => useStore.getState().setHUDVisible(data.visible))
        onNUI('radar', (data) => useStore.getState().setRadar(data))
        onNUI('radar:visible', (data) => useStore.getState().setRadarVisible(data.visible))
        onNUI('scoreboard', (data) => useStore.getState().setScoreboard(data.players))
        onNUI('scoreboard:visible', (data) => useStore.getState().setScoreboardVisible(data.visible))
        onNUI('match', (data) => useStore.getState().setMatch(data))
        onNUI('match:visible', (data) => useStore.getState().setMatchVisible(data.visible))
        onNUI('aircraft', (data) => useStore.getState().setAircraft(data))
        onNUI('aircraft:visible', (data) => useStore.getState().setAircraftVisible(data.visible))
        onNUI('killfeed', (data) => useStore.getState().addKill(data))
        onNUI('warning:add', (data) => useStore.getState().addWarning(data))
        onNUI('warning:remove', (data) => useStore.getState().removeWarning(data.id))
        onNUI('warning:clear', () => useStore.getState().clearWarnings())
        onNUI('loadout', (data) => useStore.getState().setLoadout(data))
        onNUI('loadout:visible', (data) => useStore.getState().setLoadoutVisible(data.visible))

        onNUI('close', () => {
            const s = useStore.getState()
            s.closeModal()
            s.closeMenu()
            s.closeContext()
            s.closeDialog()
            s.hideProgress()
            s.setScoreboardVisible(false)
            s.setLoadoutVisible(false)
            fetchNUI('close')
        })
    }, [])

    return (
        <div className="w-screen h-screen relative pointer-events-none">
            <Notifications />
            <Modal />
            <Menu />
            <ContextMenu />
            <Dialog />
            <Progress />
            <HUD />
            <Radar />
            <Scoreboard />
            <Match />
            <AircraftStatus />
            <KillFeed />
            <Warning />
            <Loadout />
        </div>
    )
}
