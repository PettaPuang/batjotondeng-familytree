"use client"

import { useEffect, useState } from "react"

import {
  PersonLimitedDetail,
  PersonProfileDetail,
  type LimitedPerson,
} from "@/components/silsilah/person-profile-detail"
import { PersonRelationDetail } from "@/components/silsilah/person-relation-detail"
import { formatPersonTreeName } from "@/lib/silsilah/person-display"
import type { PersonViewerContext } from "@/lib/silsilah/person-relation-context"
import type { PersonWithRelations } from "@/lib/silsilah/types"

export type PersonDetailPayload =
  | {
      access: "full"
      person: PersonWithRelations
      viewerContext: PersonViewerContext | null
    }
  | { access: "limited"; person: LimitedPerson }

type PersonDetailBodyProps = {
  personId: string
  onTitleChange?: (title: string) => void
  onLoaded?: (payload: PersonDetailPayload) => void
}

type FullResponse = {
  access: "full"
  person: PersonWithRelations
  viewerContext?: PersonViewerContext | null
}

type LimitedResponse = {
  access: "limited"
  person: LimitedPerson
}

type DetailResponse = FullResponse | LimitedResponse

function normalizePersonWithRelations(
  person: PersonWithRelations,
): PersonWithRelations {
  return {
    ...person,
    birthDate: person.birthDate ? new Date(person.birthDate) : null,
    deathDate: person.deathDate ? new Date(person.deathDate) : null,
    createdAt: new Date(person.createdAt),
    updatedAt: new Date(person.updatedAt),
  }
}

export function PersonDetailBody({
  personId,
  onTitleChange,
  onLoaded,
}: PersonDetailBodyProps) {
  const [payload, setPayload] = useState<PersonDetailPayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void fetch(`/api/silsilah/person/${personId}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Gagal memuat data anggota.")
        }

        return response.json() as Promise<DetailResponse>
      })
      .then((data) => {
        if (cancelled) {
          return
        }

        let next: PersonDetailPayload

        if (data.access === "full") {
          const person = normalizePersonWithRelations(data.person)
          next = {
            access: "full",
            person,
            viewerContext: data.viewerContext ?? null,
          }
          onTitleChange?.(
            formatPersonTreeName(person.fullName, person.gender, person.isAlive),
          )
        } else {
          next = { access: "limited", person: data.person }
          onTitleChange?.(
            formatPersonTreeName(
              data.person.fullName,
              data.person.gender,
              data.person.isAlive,
            ),
          )
        }

        setPayload(next)
        onLoaded?.(next)
      })
      .catch(() => {
        if (!cancelled) {
          setError("Gagal memuat data anggota.")
        }
      })

    return () => {
      cancelled = true
    }
  }, [onLoaded, onTitleChange, personId])

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

export type { PersonDetailBodyProps }
