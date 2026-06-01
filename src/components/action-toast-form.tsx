"use client"

import {
  useTransition,
  type FormHTMLAttributes,
  type ReactNode,
} from "react"
import { toast } from "sonner"

import { isNextRedirectError } from "@/lib/utils"
import { toastMessages } from "@/lib/toast-messages"

type ActionToastFormProps = Omit<FormHTMLAttributes<HTMLFormElement>, "action"> & {
  action: (formData: FormData) => Promise<void>
  successMessage: string
  errorMessage?: string
  children: ReactNode
}

export function ActionToastForm({
  action,
  successMessage,
  errorMessage = toastMessages.defaultError,
  children,
  className,
  onSubmit,
  ...props
}: ActionToastFormProps) {
  const [pending, startTransition] = useTransition()

  return (
    <form
      {...props}
      className={className}
      data-pending={pending ? "" : undefined}
      onSubmit={(event) => {
        onSubmit?.(event)

        if (event.defaultPrevented) {
          return
        }

        if (pending) {
          event.preventDefault()
          return
        }

        event.preventDefault()
        const formData = new FormData(event.currentTarget)

        startTransition(async () => {
          try {
            await action(formData)
            toast.success(successMessage)
          } catch (error) {
            if (isNextRedirectError(error)) {
              toast.success(successMessage)
              throw error
            }

            toast.error(
              error instanceof Error ? error.message : errorMessage,
            )
          }
        })
      }}
    >
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
    </form>
  )
}
