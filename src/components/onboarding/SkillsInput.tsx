'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

export function SkillsInput({
  value,
  onChange,
}: {
  value: string[]
  onChange: (skills: string[]) => void
}) {
  const [input, setInput] = useState('')

  const add = (raw: string) => {
    const skill = raw.trim()
    if (!skill) return
    if (value.some((s) => s.toLowerCase() === skill.toLowerCase())) return
    if (value.length >= 50) return
    onChange([...value, skill])
    setInput('')
  }

  const remove = (skill: string) => onChange(value.filter((s) => s !== skill))

  return (
    <div>
      <label className="block text-label text-gray-700 mb-1.5">Skills</label>
      <div className="flex flex-wrap gap-2 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary-300 focus-within:border-primary-600">
        {value.map((skill) => (
          <span
            key={skill}
            className="bg-gray-50 text-gray-700 text-xs px-2 py-0.5 rounded-md border border-gray-200 flex items-center gap-1"
          >
            {skill}
            <button type="button" onClick={() => remove(skill)} className="text-gray-500 hover:text-danger">
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              add(input)
            } else if (e.key === 'Backspace' && !input && value.length) {
              remove(value[value.length - 1])
            }
          }}
          placeholder={value.length ? '' : 'Type a skill and press Enter (e.g. React, Python, SQL)'}
          className="flex-1 min-w-[140px] text-sm outline-none bg-transparent"
        />
      </div>
      <p className="text-gray-500 text-xs mt-1">Press Enter or comma to add. Add as many as you like.</p>
    </div>
  )
}
