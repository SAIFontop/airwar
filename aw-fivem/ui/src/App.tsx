import { useEffect } from 'react'
import { onNUI, fetchNUI } from './nui'
import { useStore } from './store'
import Notifications from './systems/Notifications'
import Modal from './systems/Modal'
import Menu from './systems/Menu'
import ContextMenu from './systems/ContextMenu'
import Dialog from './systems/Dialog'
import Progress from './systems/Progress'
import HUD from './systems/HUD'
import Radar from './systems/Radar'
import Scoreboard from './systems/Scoreboard'
import Match from './systems/Match'
import AircraftStatus from './systems/AircraftStatus'
import KillFeed from './systems/KillFeed'
import Warning from './systems/Warning'
import Loadout from './systems/Loadout'

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
