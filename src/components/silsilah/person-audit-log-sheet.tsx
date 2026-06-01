"use client"

import type { PersonAuditLog } from "@prisma/client"

import { PersonAuditLogEntry } from "@/components/silsilah/person-audit-log-entry"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"

type PersonAuditLogSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  personName?: string | null
  auditLogs: PersonAuditLog[] | null
  auditError?: string | null
}

export function PersonAuditLogSheet({
  open,
  onOpenChange,
  personName,
  auditLogs,
  auditError,
}: PersonAuditLogSheetProps) {
  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent side="right" size="auto">
        <SheetTitle className="sr-only">
          Log Audit{personName ? ` · ${personName}` : ""}
        </SheetTitle>

        <SheetBody>
          {auditError ? (
            <p className="text-destructive text-sm">{auditError}</p>
          ) : auditLogs === null ? (
            <p className="text-muted-foreground text-sm">Memuat...</p>
          ) : auditLogs.length === 0 ? (
            <p className="text-muted-foreground text-sm">Belum ada log audit.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {auditLogs.map((log) => (
                <PersonAuditLogEntry key={log.id} log={log} />
              ))}
            </div>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
