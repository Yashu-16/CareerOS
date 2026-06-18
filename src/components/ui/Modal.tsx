'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect } from 'react'

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}) {
  const reduced = useReducedMotion()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-gray-900/40" onClick={onClose} />
          <motion.div
            className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            initial={reduced ? false : { scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reduced ? undefined : { scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              {title && <h2 className="text-h2 text-gray-900">{title}</h2>}
              <button
                onClick={onClose}
                className="text-gray-500 hover:bg-gray-100 rounded-lg p-1.5 transition-colors ml-auto"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
