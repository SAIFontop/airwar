import { nuiAction } from '../../bridge/actions'
import { useStore } from '../../store/useStore'
import './Dashboard.css'

export default function Dashboard() {
    const profile = useStore(s => s.profile)
    const panels = useStore(s => s.panels)

    const kd = profile.deaths > 0 ? (profile.kills / profile.deaths).toFixed(2) : profile.kills.toFixed(2)

    const close = () => nuiAction('closePanel', { panel: 'dashboard' })

    return (
        <div className="dashboard-overlay">
            <div className="dashboard-panel">
                <div className="dashboard-header">
                    <h2>PILOT DASHBOARD</h2>
                    <span className="dashboard-close" onClick={close}>✕</span>
                </div>

                <div className="dashboard-identity">
                    <div className="dashboard-callsign">{profile.callsign || 'UNKNOWN'}</div>
                    <div className="dashboard-rank">{profile.rank || 'Recruit'}</div>
                    <div className="dashboard-faction">{profile.faction?.toUpperCase() || 'UNASSIGNED'}</div>
                </div>

                <div className="dashboard-stats">
                    <div className="dashboard-stat">
                        <span className="dashboard-stat-label">BALANCE</span>
                        <span className="dashboard-stat-value credits">${profile.balance.toLocaleString()}</span>
                    </div>
                    <div className="dashboard-stat">
                        <span className="dashboard-stat-label">KILLS</span>
                        <span className="dashboard-stat-value">{profile.kills}</span>
                    </div>
                    <div className="dashboard-stat">
                        <span className="dashboard-stat-label">DEATHS</span>
                        <span className="dashboard-stat-value">{profile.deaths}</span>
                    </div>
                    <div className="dashboard-stat">
                        <span className="dashboard-stat-label">K/D RATIO</span>
                        <span className="dashboard-stat-value">{kd}</span>
                    </div>
                    <div className="dashboard-stat">
                        <span className="dashboard-stat-label">SORTIES</span>
                        <span className="dashboard-stat-value">{profile.sorties}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
