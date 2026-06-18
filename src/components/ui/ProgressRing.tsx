'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

interface Props {
  score: number
  size?: number
  strokeWidth?: number
}

export default function ProgressRing({ score, size = 120, strokeWidth = 10 }: Props) {
  const [displayScore, setDisplayScore] = useState(0)
  const prefersReduced = useReducedMotion()

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (displayScore / 100) * circumference

  const color = score >= 70 ? '#0E9F6E' : score >= 40 ? '#FF5A1F' : '#E02424'

  useEffect(() => {
    if (prefersReduced) {
      setDisplayScore(score)
      return
    }
    const duration = 1200
    const start = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayScore(Math.round(score * eased))
      if (progress === 1) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [score, prefersReduced])

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: prefersReduced ? 'none' : 'stroke-dashoffset 0.016s linear' }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-2xl font-bold" style={{ color }}>
          {displayScore}
        </span>
        <span className="text-xs text-gray-500 block">/100</span>
      </div>
    </div>
  )
}
