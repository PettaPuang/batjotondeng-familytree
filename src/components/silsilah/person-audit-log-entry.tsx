import type { PersonAuditLog } from "@prisma/client"

import { formatDateTime } from "@/lib/silsilah/format"
import { formatAuditDisplayValue } from "@/lib/silsilah/person-audit"
import { cn } from "@/lib/utils"

const fieldBoxClassName =
  "bg-input/50 flex min-h-8 items-center rounded-2xl border border-transparent px-2.5 py-1.5 text-sm truncate"

const AUDIT_SUMMARY_LABELS = {
  CREATE: "Dibuat",
  UPDATE: "Diperbarui",
  DELETE: "Dihapus",
} as const

export function PersonAuditLogEntry({ log }: { log: PersonAuditLog }) {
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
