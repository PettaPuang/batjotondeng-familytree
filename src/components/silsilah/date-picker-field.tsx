"use client"

import { useState } from "react"

import { DatePicker } from "@/components/ui/date-picker"
import { toDateInputValue } from "@/lib/silsilah/format"

type DatePickerFieldProps = {
  name: string
  id: string
  defaultValue?: Date | string | null
  placeholder?: string
  required?: boolean
  className?: string
}

export function DatePickerField({
  name,
  id,
  defaultValue,
  placeholder,
  required,
  className,
}: DatePickerFieldProps) {
  const [value, setValue] = useState(toDateInputValue(defaultValue ?? null))

  return (
    <DatePicker
      className={className}
      id={id}
      name={name}
      onChange={setValue}
      placeholder={placeholder}
      required={required}
      value={value}
    />
  )
}
