"use client"

import { useState, useTransition } from "react"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { signOutAction } from "@/app/auth-actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { isNextRedirectError } from "@/lib/is-next-redirect-error"
import { toastMessages } from "@/lib/toast-messages"

export function SignOutButton() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        await signOutAction()
        toast.success(toastMessages.signedOut)
      } catch (error) {
        if (isNextRedirectError(error)) {
          toast.success(toastMessages.signedOut)
          throw error
        }

        toast.error(toastMessages.defaultError)
      }
    })
  }

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <AlertDialogTrigger asChild>
        <Button disabled={pending} type="button" variant="outline">
          Keluar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Keluar dari akun?</AlertDialogTitle>
          <AlertDialogDescription>
            Anda akan keluar dari silsilah dan kembali ke halaman masuk. Lanjutkan?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending} type="button">
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(event) => {
              event.preventDefault()
              handleConfirm()
            }}
            type="button"
          >
            {pending ? (
              <>
                <Loader2Icon className="animate-spin" />
                Keluar...
              </>
            ) : (
              "Ya, Keluar"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
