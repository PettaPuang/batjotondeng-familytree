"use client"

import { useEffect, useState } from "react"

import { PersonProfileDetail } from "@/components/silsilah/person-profile-detail"
import { PersonRelationDetail } from "@/components/silsilah/person-relation-detail"
import { formatPersonTreeName } from "@/lib/silsilah/person-display"
import type { PersonViewerContext } from "@/lib/silsilah/person-relation-context"
import type { PersonWithRelations } from "@/lib/silsilah/types"
import type { Person } from "@prisma/client"

export type PersonDetailPayload = {
  person: PersonWithRelations
  viewerContext: PersonViewerContext | null
}

type PersonDetailBodyProps = {
  personId: string
  onTitleChange?: (title: string) => void
  onLoaded?: (payload: PersonDetailPayload) => void
}

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
  const [person, setPerson] = useState<Person | null>(null)
  const [viewerContext, setViewerContext] = useState<PersonViewerContext | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void fetch(`/api/silsilah/person/${personId}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Gagal memuat data anggota.")
        }

        return response.json() as Promise<
          PersonWithRelations & { viewerContext?: PersonViewerContext | null }
        >
      })
      .then((data) => {
        if (cancelled) {
          return
        }

        const { viewerContext: context, ...personData } = data
        const normalized = normalizePersonWithRelations(personData)
        setPerson(normalized)
        setViewerContext(context ?? null)
        onTitleChange?.(
          formatPersonTreeName(
            normalized.fullName,
            normalized.gender,
            normalized.isAlive,
          ),
        )
        onLoaded?.({ person: normalized, viewerContext: context ?? null })
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

  if (!person) {
    return <p className="text-muted-foreground text-sm">Memuat...</p>
  }

  return (
    <div className="flex flex-col gap-6">
      {viewerContext ? <PersonRelationDetail context={viewerContext} /> : null}
      <PersonProfileDetail person={person} />
    </div>
  )
}

export type { PersonDetailBodyProps }
