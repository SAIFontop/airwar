import { useState } from 'react'
import { nuiAction } from '../../bridge/actions'
import { useStore } from '../../store/useStore'
import './Hangar.css'

type Tab = 'aircraft' | 'loadout' | 'store'

export default function Hangar() {
    const [tab, setTab] = useState<Tab>('aircraft')
    const loadout = useStore(s => s.loadout)
    const profile = useStore(s => s.profile)

    const close = () => nuiAction('closePanel', { panel: 'hangar' })
    const selectAircraft = (type: string) => nuiAction('selectAircraft', { type })
    const purchaseItem = (itemId: string) => nuiAction('purchaseItem', { item_id: itemId })

    return (
        <div className="hangar-overlay">
            <div className="hangar-panel">
                <div className="hangar-header">
                    <h2>HANGAR</h2>
                    <div className="hangar-balance">${profile.balance.toLocaleString()}</div>
                    <span className="hangar-close" onClick={close}>✕</span>
                </div>

                <div className="hangar-tabs">
                    <button className={tab === 'aircraft' ? 'active' : ''} onClick={() => setTab('aircraft')}>AIRCRAFT</button>
                    <button className={tab === 'loadout' ? 'active' : ''} onClick={() => setTab('loadout')}>LOADOUT</button>
                    <button className={tab === 'store' ? 'active' : ''} onClick={() => setTab('store')}>STORE</button>
                </div>

                <div className="hangar-body">
                    {tab === 'aircraft' && <AircraftTab onSelect={selectAircraft} />}
                    {tab === 'loadout' && <LoadoutTab loadout={loadout} />}
                    {tab === 'store' && <StoreTab balance={profile.balance} onPurchase={purchaseItem} />}
                </div>
            </div>
        </div>
    )
}

function AircraftTab({ onSelect }: { onSelect: (type: string) => void }) {
    return (
        <div className="hangar-section">
            <p className="hangar-hint">Select an aircraft to fly. Owned aircraft are highlighted.</p>
            <div className="hangar-grid" id="aircraft-grid">
                {/* Aircraft list populated via NUI message updates */}
                <div className="hangar-placeholder">Aircraft data loading...</div>
            </div>
        </div>
    )
}

function LoadoutTab({ loadout }: { loadout: ReturnType<typeof useStore.getState>['loadout'] }) {
    return (
        <div className="hangar-section">
            <p className="hangar-hint">Current loadout on selected aircraft.</p>
            <div className="hangar-hardpoints">
                {loadout.hardpoints.length === 0 && <div className="hangar-placeholder">No aircraft selected</div>}
                {loadout.hardpoints.map((hp) => (
                    <div key={hp.slot} className={`hangar-hardpoint ${hp.slot === loadout.selectedSlot ? 'selected' : ''}`}>
                        <span className="hp-slot">HP{hp.slot}</span>
                        <span className="hp-weapon">{hp.weapon}</span>
                        <span className="hp-ammo">{hp.ammo}/{hp.max_ammo}</span>
                    </div>
                ))}
            </div>
            <div className="hangar-cm-row">
                <div className="hangar-cm">FLARES: {loadout.flares}</div>
                <div className="hangar-cm">CHAFF: {loadout.chaff}</div>
            </div>
        </div>
    )
}

function StoreTab({ balance, onPurchase }: { balance: number; onPurchase: (id: string) => void }) {
    return (
        <div className="hangar-section">
            <p className="hangar-hint">Purchase aircraft, weapons, and upgrades.</p>
            <div className="hangar-grid" id="store-grid">
                <div className="hangar-placeholder">Store items loading...</div>
            </div>
        </div>
    )
}
