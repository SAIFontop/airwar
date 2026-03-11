import { AnimatePresence, motion } from 'framer-motion'
import { fetchNUI } from '../framework/nui'
import { useStore } from '../framework/store'

export default function Loadout() {
    const loadout = useStore((s) => s.loadout)
    const visible = useStore((s) => s.loadoutVisible)

    if (!visible || !loadout) return null

    const handleSelect = (type: string, id: string) => {
        fetchNUI('action', { type: 'loadout', selection: { type, id } })
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 flex items-center justify-center z-30 pointer-events-auto"
            >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 30, opacity: 0 }}
                    className="relative bg-aw-surface border border-aw-border rounded-xl p-6 w-[700px] max-h-[80vh] overflow-y-auto"
                >
                    <h2 className="text-lg font-bold text-aw-text mb-4">Select Loadout</h2>

                    {loadout.aircraft && (
                        <div className="mb-4">
                            <h3 className="text-sm text-aw-muted mb-2 uppercase tracking-wider">Aircraft</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {loadout.aircraft.map((a: any) => (
                                    <button
                                        key={a.id}
                                        onClick={() => handleSelect('aircraft', a.id)}
                                        className="bg-aw-bg border border-aw-border rounded-lg p-3 text-left hover:border-aw-primary/50 transition-colors"
                                    >
                                        <p className="text-sm font-medium text-aw-text">{a.name}</p>
                                        <p className="text-xs text-aw-muted">{a.role}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {loadout.weapons && (
                        <div>
                            <h3 className="text-sm text-aw-muted mb-2 uppercase tracking-wider">Weapons</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {loadout.weapons.map((w: any) => (
                                    <button
                                        key={w.id}
                                        onClick={() => handleSelect('weapon', w.id)}
                                        className="bg-aw-bg border border-aw-border rounded-lg p-3 text-left hover:border-aw-primary/50 transition-colors"
                                    >
                                        <p className="text-sm font-medium text-aw-text">{w.name}</p>
                                        <p className="text-xs text-aw-muted">{w.type}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
