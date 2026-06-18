'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect } from 'react'

export function Drawer({
  open,
  onClose,
  children,
  width = 'max-w-xl',
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  width?: string
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
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-gray-900/40" onClick={onClose} />
          <motion.div
            className={`absolute right-0 top-0 h-full w-full ${width} bg-white shadow-xl overflow-y-auto`}
            initial={reduced ? false : { x: '100%' }}
            animate={{ x: 0 }}
            exit={reduced ? undefined : { x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 text-gray-500 hover:bg-gray-100 rounded-lg p-1.5 transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
