"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"

import { resolveLoginErrorMessage } from "@/lib/toast-messages"

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
    toast.error(resolveLoginErrorMessage())
  }, [error])

  return null
}
