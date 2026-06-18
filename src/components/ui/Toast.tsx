'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'
interface Toast {
  id: number
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const icons = {
  success: <CheckCircle2 size={18} className="text-success" />,
  error: <AlertCircle size={18} className="text-danger" />,
  info: <Info size={18} className="text-primary-600" />,
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              className="bg-white border border-gray-200 rounded-lg shadow-md p-3 flex items-start gap-3"
            >
              {icons[t.type]}
              <p className="text-body-sm text-gray-900 flex-1">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="text-gray-500 hover:text-gray-700">
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
