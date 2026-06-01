"use client"

import {
  PersonLimitedDetail,
  PersonProfileDetail,
} from "@/components/silsilah/person-profile-detail"
import { PersonRelationDetail } from "@/components/silsilah/person-relation-detail"
import type { PersonDetailPayload } from "@/lib/silsilah/types"

type PersonDetailBodyProps = {
  payload: PersonDetailPayload | null
  error?: string | null
}

export function PersonDetailBody({ payload, error }: PersonDetailBodyProps) {
  if (error) {
    return <p className="text-destructive text-sm">{error}</p>
  }

  if (!payload) {
    return <p className="text-muted-foreground text-sm">Memuat...</p>
  }

  if (payload.access === "limited") {
    return <PersonLimitedDetail person={payload.person} />
  }

  return (
    <div className="flex flex-col gap-6">
      {payload.viewerContext ? (
        <PersonRelationDetail context={payload.viewerContext} />
      ) : null}
      <PersonProfileDetail person={payload.person} />
    </div>
  )
}
