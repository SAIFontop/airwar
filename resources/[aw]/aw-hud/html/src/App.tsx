import Dashboard from './panels/Dashboard/Dashboard'
import Hangar from './panels/Hangar/Hangar'
import HUD from './panels/HUD/HUD'
import KillFeed from './panels/KillFeed/KillFeed'
import MissionBoard from './panels/MissionBoard/MissionBoard'
import RadarScope from './panels/RadarScope/RadarScope'
import RespawnOverlay from './panels/RespawnOverlay/RespawnOverlay'
import Scoreboard from './panels/Scoreboard/Scoreboard'
import SquadronPanel from './panels/SquadronPanel/SquadronPanel'
import WarMap from './panels/WarMap/WarMap'
import { useStore } from './store/useStore'

export default function App() {
    const hudVisible = useStore(s => s.hudVisible)
    const panels = useStore(s => s.panels)
    const respawn = useStore(s => s.respawn)

    return (
        <>
            {hudVisible && <HUD />}
            {hudVisible && <RadarScope />}
            <KillFeed />
            {panels.warMap && <WarMap />}
            {panels.scoreboard && <Scoreboard />}
            {panels.dashboard && <Dashboard />}
            {panels.hangar && <Hangar />}
            {panels.missionBoard && <MissionBoard />}
            {panels.squadronPanel && <SquadronPanel />}
            {respawn.show && <RespawnOverlay />}
        </>
    )
}
