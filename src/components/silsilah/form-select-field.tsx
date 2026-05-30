"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export type FormSelectOption = {
  value: string
  label: string
  disabled?: boolean
}

type FormSelectFieldProps = {
  name: string
  id?: string
  value: string
  onValueChange: (value: string) => void
  options: FormSelectOption[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
  triggerClassName?: string
  "aria-invalid"?: boolean
}

export function FormSelectField({
  name,
  id,
  value,
  onValueChange,
  options,
  placeholder = "Pilih…",
  required,
  disabled,
  triggerClassName,
  "aria-invalid": ariaInvalid,
}: FormSelectFieldProps) {
  return (
    <>
      <input
        aria-hidden
        name={name}
        readOnly
        tabIndex={-1}
        type="hidden"
        value={value}
        required={required && !value}
      />
      <Select
        disabled={disabled}
        onValueChange={onValueChange}
        value={value || undefined}
      >
        <SelectTrigger
          id={id}
          className={cn("w-full", triggerClassName)}
          aria-invalid={ariaInvalid}
          size="default"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position="popper" className="w-(--radix-select-trigger-width)">
          <SelectGroup>
            {options.map((option) => (
              <SelectItem
                key={option.value}
                disabled={option.disabled}
                value={option.value}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  )
}
