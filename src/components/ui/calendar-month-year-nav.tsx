"use client"

import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { useMemo, type RefObject } from "react"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type CalendarMonthYearNavProps = {
  month: Date
  onMonthChange: (month: Date) => void
  fromYear: number
  toYear: number
  selectContainer?: RefObject<HTMLElement | null>
}

function isSelectOverlayTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return Boolean(
    target.closest('[data-slot="select-content"]') ||
      target.closest('[data-slot="select-item"]') ||
      target.closest('[data-slot="select-scroll-up-button"]') ||
      target.closest('[data-slot="select-scroll-down-button"]'),
  )
}

export function calendarDatePickerDismissGuard(event: { target: EventTarget | null; preventDefault: () => void }) {
  if (isSelectOverlayTarget(event.target)) {
    event.preventDefault()
  }
}

export function CalendarMonthYearNav({
  month,
  onMonthChange,
  fromYear,
  toYear,
  selectContainer,
}: CalendarMonthYearNavProps) {
  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        value: String(index),
        label: format(new Date(2024, index, 1), "MMMM", { locale: localeId }),
      })),
    [],
  )

  const yearOptions = useMemo(() => {
    const years: { value: string; label: string }[] = []

    for (let year = fromYear; year <= toYear; year += 1) {
      years.push({ value: String(year), label: String(year) })
    }

    return years
  }, [fromYear, toYear])

  const monthValue = String(month.getMonth())
  const yearValue = String(month.getFullYear())
  const selectContentProps = {
    container: selectContainer?.current ?? undefined,
    position: "popper" as const,
    className: "z-250 max-h-60",
  }

  return (
    <div className="relative z-10 flex items-center gap-2 border-b px-3 py-2">
      <Select
        onValueChange={(value) => {
          onMonthChange(new Date(month.getFullYear(), Number(value), 1))
        }}
        value={monthValue}
      >
        <SelectTrigger aria-label="Pilih bulan" className="h-8 min-w-28 flex-1" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent {...selectContentProps}>
          <SelectGroup>
            {monthOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        onValueChange={(value) => {
          onMonthChange(new Date(Number(value), month.getMonth(), 1))
        }}
        value={yearValue}
      >
        <SelectTrigger aria-label="Pilih tahun" className="h-8 min-w-22" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent {...selectContentProps}>
          <SelectGroup>
            {yearOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
