"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"

type LoginErrorToastProps = {
  error?: string
}

export function LoginErrorToast({ error }: LoginErrorToastProps) {
  const shownRef = useRef<string | null>(null)

  useEffect(() => {
    if (!error || shownRef.current === error) {
      return
    }

    shownRef.current = error
    toast.error(error)
  }, [error])

  return null
}
