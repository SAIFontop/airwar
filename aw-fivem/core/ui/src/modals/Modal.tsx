import { AnimatePresence, motion } from 'framer-motion'
import { fetchNUI } from '../framework/nui'
import { useStore } from '../framework/store'

export default function Modal() {
    const modal = useStore((s) => s.modal)
    const closeModal = useStore((s) => s.closeModal)

    if (!modal) return null

    const handleAction = (action: string) => {
        fetchNUI('action', { type: 'modal', action })
        closeModal()
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 flex items-center justify-center z-40 pointer-events-auto"
                onClick={closeModal}
            >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative bg-aw-surface border border-aw-border rounded-xl p-6 max-w-md w-full mx-4"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h2 className="text-lg font-semibold text-aw-text mb-2">{modal.title}</h2>
                    <p className="text-sm text-aw-muted mb-6">{modal.content}</p>
                    <div className="flex justify-end gap-2">
                        {modal.buttons?.map((btn, i) => (
                            <button
                                key={i}
                                onClick={() => handleAction(btn.action)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${btn.variant === 'danger'
                                        ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                                        : btn.variant === 'primary'
                                            ? 'bg-aw-primary/20 text-blue-300 hover:bg-aw-primary/30'
                                            : 'bg-white/5 text-aw-muted hover:bg-white/10'
                                    }`}
                            >
                                {btn.label}
                            </button>
                        )) || (
                                <button
                                    onClick={closeModal}
                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 text-aw-muted hover:bg-white/10"
                                >
                                    Close
                                </button>
                            )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
