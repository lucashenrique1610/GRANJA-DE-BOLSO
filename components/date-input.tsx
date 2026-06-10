"use client"

import type React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "lucide-react"
import { formatDateInput } from "@/lib/date-utils"

interface DateInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  name?: string
}

export function DateInput({
  id,
  label,
  value,
  onChange,
  placeholder = "DD/MM/AAAA",
  required = false,
  disabled = false,
  className = "",
  name,
}: DateInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedDate = formatDateInput(e.target.value)
    onChange(formattedDate)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name || id}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={10}
          required={required}
          disabled={disabled}
        />
        <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  )
}
