import type { PersonAuditLog } from "@prisma/client"

import { formatDateTime } from "@/lib/silsilah/format"
import {
  formatAuditDisplayValue,
  PERSON_AUDIT_ACTION_LABELS,
} from "@/lib/silsilah/person-audit"
import { cn } from "@/lib/utils"

const fieldBoxClassName =
  "bg-input/50 flex min-h-8 items-center rounded-2xl border border-transparent px-2.5 py-1.5 text-sm truncate"

export function PersonAuditLogEntry({ log }: { log: PersonAuditLog }) {
  const formattedDate = formatDateTime(log.createdAt)
  const formattedActor = formatAuditDisplayValue(log.actorName)

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-center sm:gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-muted-foreground text-xs sm:sr-only">Aksi</span>
        <span className="text-sm font-medium sm:font-normal">
          {PERSON_AUDIT_ACTION_LABELS[log.action]}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-muted-foreground text-xs sm:sr-only">Tanggal</span>
        <div className={cn(fieldBoxClassName)} title={formattedDate}>
          {formattedDate}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-muted-foreground text-xs sm:sr-only">Oleh</span>
        <div className={cn(fieldBoxClassName)} title={formattedActor}>
          {formattedActor}
        </div>
      </div>
    </div>
  )
}
