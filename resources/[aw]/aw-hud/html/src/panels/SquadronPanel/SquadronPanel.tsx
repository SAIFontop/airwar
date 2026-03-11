import { nuiAction } from '../../bridge/actions'
import { useStore } from '../../store/useStore'
import './SquadronPanel.css'

export default function SquadronPanel() {
    const squadron = useStore(s => s.squadron)
    const profile = useStore(s => s.profile)

    const close = () => nuiAction('closePanel', { panel: 'squadronPanel' })

    const formations = ['finger_four', 'echelon', 'line_abreast', 'trail', 'wedge', 'combat_spread']

    return (
        <div className="sqpanel-overlay">
            <div className="sqpanel-panel">
                <div className="sqpanel-header">
                    <h2>SQUADRON</h2>
                    <span className="sqpanel-close" onClick={close}>✕</span>
                </div>

                {!squadron.id ? (
                    <div className="sqpanel-no-squad">
                        <p>You are not in a squadron.</p>
                        <button className="sqpanel-create-btn" onClick={() => nuiAction('uiAction', { action: 'create_squadron' })}>
                            CREATE SQUADRON
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="sqpanel-info">
                            <span className="sqpanel-label">FORMATION</span>
                            <span className="sqpanel-formation">{squadron.formation?.replace(/_/g, ' ').toUpperCase() || 'NONE'}</span>
                        </div>

                        <div className="sqpanel-members">
                            <h3>MEMBERS ({squadron.members.length}/4)</h3>
                            {squadron.members.map((m) => (
                                <div key={m.awid} className="sqpanel-member">
                                    <span className="sqpanel-slot">#{m.slot}</span>
                                    <span className="sqpanel-member-name">{m.callsign}</span>
                                    {m.slot === 1 && <span className="sqpanel-leader">LEAD</span>}
                                </div>
                            ))}
                        </div>

                        <div className="sqpanel-formations">
                            <h3>SET FORMATION</h3>
                            <div className="sqpanel-formation-grid">
                                {formations.map((f) => (
                                    <button
                                        key={f}
                                        className={`sqpanel-formation-btn ${squadron.formation === f ? 'active' : ''}`}
                                        onClick={() => nuiAction('uiAction', { action: 'set_formation', formation: f })}
                                    >
                                        {f.replace(/_/g, ' ').toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button className="sqpanel-leave-btn" onClick={() => nuiAction('uiAction', { action: 'leave_squadron' })}>
                            LEAVE SQUADRON
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}
