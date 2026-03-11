import { AnimatePresence, motion } from 'framer-motion'
import { fetchNUI } from '../framework/nui'
import { useStore } from '../framework/store'

export default function Menu() {
    const menu = useStore((s) => s.menu)
    const closeMenu = useStore((s) => s.closeMenu)

    if (!menu) return null

    const handleClick = (id: string) => {
        fetchNUI('action', { type: 'menu', id })
        closeMenu()
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 flex items-center justify-center z-30 pointer-events-auto"
            >
                <div className="absolute inset-0 bg-black/40" onClick={closeMenu} />
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    className="relative bg-aw-surface border border-aw-border rounded-xl w-80 max-h-[70vh] overflow-hidden"
                >
                    <div className="px-4 py-3 border-b border-aw-border">
                        <h3 className="text-base font-semibold text-aw-text">{menu.title}</h3>
                    </div>
                    <div className="overflow-y-auto max-h-[60vh]">
                        {menu.items.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => !item.disabled && handleClick(item.id)}
                                disabled={item.disabled}
                                className={`w-full text-left px-4 py-3 border-b border-aw-border/50 transition-colors ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/5 cursor-pointer'
                                    }`}
                            >
                                <span className="text-sm font-medium text-aw-text">{item.label}</span>
                                {item.description && <p className="text-xs text-aw-muted mt-0.5">{item.description}</p>}
                            </button>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
