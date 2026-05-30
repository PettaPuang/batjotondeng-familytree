"use client"

import { useState, useTransition } from "react"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"

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
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toastMessages } from "@/lib/toast-messages"

type DeletePersonButtonProps = {
  personId: string
  personName: string
  /** Dipanggil setelah hapus via API (mis. sheet detail) */
  onDeleted?: () => void
  className?: string
}

export function DeletePersonButton({
  personId,
  personName,
  onDeleted,
  className,
}: DeletePersonButtonProps) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/silsilah/person/${personId}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {
            error?: string
          } | null
          throw new Error(body?.error ?? toastMessages.defaultError)
        }

        toast.success(toastMessages.personDeleted)
        setOpen(false)
        onDeleted?.()
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : toastMessages.defaultError,
        )
      }
    })
  }

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <AlertDialogTrigger asChild>
        <Button className={className} size="sm" type="button" variant="destructive">
          Hapus Anggota
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus anggota keluarga?</AlertDialogTitle>
          <AlertDialogDescription>
            Data <span className="font-medium text-foreground">{personName}</span>{" "}
            akan dihapus permanen beserta riwayat yang terkait. Tindakan ini tidak
            dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending} type="button">
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            className={cn(buttonVariants({ variant: "destructive" }))}
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
                Menghapus...
              </>
            ) : (
              "Ya, Hapus"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
