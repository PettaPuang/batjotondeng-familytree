"use client"

import { useCallback, useState } from "react"

import { PersonFormSheet } from "@/components/silsilah/person-form-sheet"
import { PersonAuditLogSheet } from "@/components/silsilah/person-audit-log-sheet"
import {
  PersonDetailBody,
  type PersonDetailPayload,
} from "@/components/silsilah/person-detail-body"
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

type PersonDetailSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  personId: string | null
  canManage?: boolean
  onPersonUpdated?: () => void
}

export function PersonDetailSheet({
  open,
  onOpenChange,
  personId,
  canManage = false,
  onPersonUpdated,
}: PersonDetailSheetProps) {
  const [auditOpen, setAuditOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [detailPayload, setDetailPayload] = useState<PersonDetailPayload | null>(
    null,
  )
  const [refreshKey, setRefreshKey] = useState(0)
  const [sheetTitle, setSheetTitle] = useState("Detail Anggota")

  const handlePersonLoaded = useCallback((payload: PersonDetailPayload) => {
    setDetailPayload(payload)
  }, [])

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)

    if (!nextOpen) {
      setAuditOpen(false)
      setEditOpen(false)
      setDetailPayload(null)
    }
  }

  const openEdit = useCallback(() => {
    if (!detailPayload) {
      return
    }

    setEditOpen(true)
  }, [detailPayload])

  const handleEditSuccess = useCallback(() => {
    onPersonUpdated?.()
    setRefreshKey((current) => current + 1)
    setDetailPayload(null)
  }, [onPersonUpdated])

  const handleDeleted = useCallback(() => {
    onPersonUpdated?.()
    onOpenChange(false)
  }, [onOpenChange, onPersonUpdated])

  const headerPerson = detailPayload?.person ?? null

  return (
    <>
      <Sheet onOpenChange={handleOpenChange} open={open}>
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
                key={`${personId}-${refreshKey}`}
                onLoaded={handlePersonLoaded}
                onTitleChange={setSheetTitle}
                personId={personId}
              />
            ) : null}
          </SheetBody>

          <SheetFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              className="w-full sm:w-auto"
              disabled={!personId}
              onClick={() => setAuditOpen(true)}
              type="button"
              variant="outline"
            >
              Log Audit
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              {canManage && personId && detailPayload ? (
                <>
                  <DeletePersonButton
                    onDeleted={handleDeleted}
                    personId={personId}
                    personName={detailPayload.person.fullName}
                  />
                  <Button onClick={openEdit} type="button">
                    Edit Data
                  </Button>
                </>
              ) : null}
              <SheetClose asChild>
                <Button variant="outline">Tutup</Button>
              </SheetClose>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <PersonAuditLogSheet
        onOpenChange={setAuditOpen}
        open={auditOpen}
        personId={personId}
        personName={sheetTitle}
      />

      {detailPayload ? (
        <PersonFormSheet
          mode="edit"
          onOpenChange={setEditOpen}
          onSuccess={handleEditSuccess}
          open={editOpen}
          person={detailPayload.person}
        />
      ) : null}
    </>
  )
}
