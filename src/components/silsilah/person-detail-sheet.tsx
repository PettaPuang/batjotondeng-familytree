"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import type { PersonAuditLog } from "@prisma/client"

import { PersonFormSheet } from "@/components/silsilah/person-form-sheet"
import { PersonAuditLogSheet } from "@/components/silsilah/person-audit-log-sheet"
import { PersonDetailBody } from "@/components/silsilah/person-detail-body"
import { DeletePersonButton } from "@/components/silsilah/delete-person-button"
import { PersonAvatar } from "@/components/silsilah/person-avatar"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  getPersonDetailTitle,
  type PersonDetailPayload,
} from "@/lib/silsilah/types"

type PersonDetailSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  personId: string | null
  personDetail: PersonDetailPayload | null
  personDetailError?: string | null
  canManage?: boolean
  auditOpen: boolean
  auditLogs: PersonAuditLog[] | null
  auditError?: string | null
  onAuditOpenChange: (open: boolean) => void
  onPersonUpdated?: () => void
}

export function PersonDetailSheet({
  open,
  onOpenChange,
  personId,
  personDetail,
  personDetailError,
  canManage = false,
  auditOpen,
  auditLogs,
  auditError,
  onAuditOpenChange,
  onPersonUpdated,
}: PersonDetailSheetProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)

  const sheetTitle = personDetail
    ? getPersonDetailTitle(personDetail)
    : "Detail Anggota"

  const headerPerson = personDetail?.person ?? null

  const openEdit = useCallback(() => {
    if (!personDetail || personDetail.access !== "full") {
      return
    }

    setEditOpen(true)
  }, [personDetail])

  const handleEditSuccess = useCallback(() => {
    onPersonUpdated?.()
    setEditOpen(false)
    router.refresh()
  }, [onPersonUpdated, router])

  const handleDeleted = useCallback(() => {
    onPersonUpdated?.()
    onOpenChange(false)
  }, [onOpenChange, onPersonUpdated])

  return (
    <>
      <Sheet onOpenChange={onOpenChange} open={open}>
        <SheetContent side="right">
          <SheetHeader className="flex flex-row items-start gap-4 pr-14">
            {headerPerson ? (
              <PersonAvatar
                className="shrink-0"
                gender={headerPerson.gender}
                name={headerPerson.fullName}
                photoUrl={headerPerson.photoUrl}
                shape="square"
                size="lg"
              />
            ) : (
              <div
                aria-hidden
                className="bg-muted size-14 shrink-0 rounded-xl"
              />
            )}
            <div className="min-w-0 flex-1 space-y-1">
              <SheetTitle className="truncate" title={sheetTitle}>
                {sheetTitle}
              </SheetTitle>
              <SheetDescription>Data pribadi anggota keluarga</SheetDescription>
            </div>
          </SheetHeader>

          <SheetBody>
            {open && personId ? (
              <PersonDetailBody
                error={personDetailError}
                payload={personDetail}
              />
            ) : null}
          </SheetBody>

          <SheetFooter className="flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            {canManage && personDetail?.access === "full" ? (
              <Button
                className="w-full sm:w-auto"
                disabled={!personId}
                onClick={() => onAuditOpenChange(true)}
                size="sm"
                type="button"
                variant="outline"
              >
                Log Audit
              </Button>
            ) : null}
            <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-2">
              {canManage && personId && personDetail?.access === "full" ? (
                <>
                  <DeletePersonButton
                    className="w-full sm:w-auto"
                    onDeleted={handleDeleted}
                    personId={personId}
                    personName={personDetail.person.fullName}
                  />
                  <Button className="w-full sm:w-auto" onClick={openEdit} size="sm" type="button">
                    Edit Data
                  </Button>
                </>
              ) : null}
              <SheetClose asChild>
                <Button className="w-full sm:w-auto" size="sm" variant="outline">
                  Tutup
                </Button>
              </SheetClose>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <PersonAuditLogSheet
        auditError={auditError}
        auditLogs={auditLogs}
        onOpenChange={onAuditOpenChange}
        open={auditOpen}
        personName={sheetTitle}
      />

      {personDetail?.access === "full" ? (
        <PersonFormSheet
          mode="edit"
          onOpenChange={setEditOpen}
          onSuccess={handleEditSuccess}
          open={editOpen}
          person={personDetail.person}
        />
      ) : null}
    </>
  )
}
