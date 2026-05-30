"use client"

import { useEffect, useState } from "react"

import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import { formatDateTime } from "@/lib/silsilah/format"
import { formatAuditDisplayValue } from "@/lib/silsilah/person-audit-shared"
import { cn } from "@/lib/utils"
import type { PersonAuditLog } from "@prisma/client"

type PersonAuditLogSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  personId: string | null
  personName?: string | null
}

const fieldBoxClassName =
  "bg-input/50 flex min-h-8 items-center rounded-2xl border border-transparent px-2.5 py-1.5 text-sm truncate"

const AUDIT_SUMMARY_LABELS = {
  CREATE: "Dibuat",
  UPDATE: "Diperbarui",
  DELETE: "Dihapus",
} as const

function AuditLogEntry({ log }: { log: PersonAuditLog }) {
  const formattedDate = formatDateTime(log.createdAt)
  const formattedActor = formatAuditDisplayValue(log.actorName)

  return (
    <div className="grid grid-cols-3 items-center gap-4">
      <span className="text-muted-foreground text-sm">
        {AUDIT_SUMMARY_LABELS[log.action]}
      </span>
      <div className={cn(fieldBoxClassName)} title={formattedDate}>
        {formattedDate}
      </div>
      <div className={cn(fieldBoxClassName)} title={formattedActor}>
        {formattedActor}
      </div>
    </div>
  )
}

function PersonAuditLogList({ personId }: { personId: string }) {
  const [logs, setLogs] = useState<PersonAuditLog[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void fetch(`/api/silsilah/person/${personId}/audit-logs`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Gagal memuat log audit.")
        }

        return response.json() as Promise<PersonAuditLog[]>
      })
      .then((data) => {
        if (!cancelled) {
          setLogs(data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Gagal memuat log audit.")
        }
      })

    return () => {
      cancelled = true
    }
  }, [personId])

  if (error) {
    return <p className="text-destructive text-sm">{error}</p>
  }

  if (logs === null) {
    return <p className="text-muted-foreground text-sm">Memuat...</p>
  }

  if (logs.length === 0) {
    return <p className="text-muted-foreground text-sm">Belum ada log audit.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {logs.map((log) => (
        <AuditLogEntry key={log.id} log={log} />
      ))}
    </div>
  )
}

export function PersonAuditLogSheet({
  open,
  onOpenChange,
  personId,
  personName,
}: PersonAuditLogSheetProps) {
  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent side="right" size="auto">
        <SheetTitle className="sr-only">
          Log Audit{personName ? ` · ${personName}` : ""}
        </SheetTitle>

        <SheetBody>
          {open && personId ? <PersonAuditLogList key={personId} personId={personId} /> : null}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
