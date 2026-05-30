"use client"

import type { ComponentProps } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function FormSubmitButton({
  className,
  children,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button className={cn("w-fit", className)} size="sm" type="submit" {...props}>
      {children}
    </Button>
  )
}
