import { useState } from 'react'
import { useStore } from '../store'
import { fetchNUI } from '../nui'
import { AnimatePresence, motion } from 'framer-motion'

export default function Dialog() {
  const dialog = useStore((s) => s.dialog)
  const closeDialog = useStore((s) => s.closeDialog)
  const [values, setValues] = useState<Record<string, string>>({})

  if (!dialog) return null

  const handleSubmit = () => {
    fetchNUI('dialog:submit', values)
    setValues({})
    closeDialog()
  }

  const handleCancel = () => {
    fetchNUI('dialog:cancel', {})
    setValues({})
    closeDialog()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center z-40 pointer-events-auto"
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCancel} />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-aw-surface border border-aw-border rounded-xl p-6 max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-semibold text-aw-text mb-4">{dialog.title}</h2>
          <div className="flex flex-col gap-3 mb-6">
            {dialog.fields.map((field) => (
              <div key={field.name}>
                <label className="block text-xs text-aw-muted mb-1">{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    value={values[field.name] || field.default || ''}
                    onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                    className="w-full bg-aw-bg border border-aw-border rounded-lg px-3 py-2 text-sm text-aw-text outline-none focus:border-aw-primary"
                  >
                    <option value="">{field.placeholder || 'Select...'}</option>
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={values[field.name] || field.default || ''}
                    placeholder={field.placeholder}
                    onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                    className="w-full bg-aw-bg border border-aw-border rounded-lg px-3 py-2 text-sm text-aw-text outline-none focus:border-aw-primary"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg text-sm bg-white/5 text-aw-muted hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 rounded-lg text-sm bg-aw-primary/20 text-blue-300 hover:bg-aw-primary/30"
            >
              Confirm
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
