"use client"

import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { useCallback, useMemo, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  CalendarMonthYearNav,
  calendarDatePickerDismissGuard,
} from "@/components/ui/calendar-month-year-nav"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  calendarDateToInputValue,
  inputValueToCalendarDate,
} from "@/lib/silsilah/format"
import { cn } from "@/lib/utils"

type DatePickerProps = {
  value?: string
  onChange?: (value: string) => void
  name?: string
  id?: string
  placeholder?: string
  className?: string
  required?: boolean
  fromYear?: number
  toYear?: number
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

export function DatePicker({
  value = "",
  onChange,
  name,
  id,
  placeholder = "Pilih tanggal",
  className,
  required,
  fromYear = 1900,
  toYear = new Date().getFullYear(),
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const popoverSurfaceRef = useRef<HTMLDivElement>(null)
  const selectedDate = useMemo(() => inputValueToCalendarDate(value), [value])
  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(selectedDate ?? new Date()),
  )

  const handleViewMonthChange = useCallback((month: Date) => {
    const nextMonth = startOfMonth(month)

    setViewMonth((current) => (isSameMonth(current, nextMonth) ? current : nextMonth))
  }, [])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        const nextMonth = startOfMonth(selectedDate ?? new Date())
        setViewMonth((current) =>
          isSameMonth(current, nextMonth) ? current : nextMonth,
        )
      }

      setOpen(nextOpen)
    },
    [selectedDate],
  )

  return (
    <>
      {name ? <input name={name} type="hidden" value={value} required={required} /> : null}

      <Popover modal={false} onOpenChange={handleOpenChange} open={open}>
        <PopoverTrigger asChild>
          <Button
            className={cn(
              "h-11 w-full justify-start px-3 font-normal md:h-9",
              !selectedDate && "text-muted-foreground",
              className,
            )}
            id={id}
            type="button"
            variant="outline"
          >
            <CalendarIcon data-icon="inline-start" />
            {selectedDate
              ? format(selectedDate, "d MMMM yyyy", { locale: localeId })
              : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="z-200 w-auto overflow-visible p-0"
          onFocusOutside={calendarDatePickerDismissGuard}
          onInteractOutside={calendarDatePickerDismissGuard}
          onPointerDownOutside={calendarDatePickerDismissGuard}
        >
          <div ref={popoverSurfaceRef}>
            <CalendarMonthYearNav
              fromYear={fromYear}
              month={viewMonth}
              onMonthChange={handleViewMonthChange}
              selectContainer={popoverSurfaceRef}
              toYear={toYear}
            />
          <Calendar
            captionLayout="label"
            endMonth={new Date(toYear, 11, 31)}
            locale={localeId}
            mode="single"
            month={viewMonth}
            onMonthChange={handleViewMonthChange}
            onSelect={(date) => {
              if (date) {
                onChange?.(calendarDateToInputValue(date))
              } else {
                onChange?.("")
              }

              setOpen(false)
            }}
            selected={selectedDate}
            startMonth={new Date(fromYear, 0, 1)}
          />
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}
