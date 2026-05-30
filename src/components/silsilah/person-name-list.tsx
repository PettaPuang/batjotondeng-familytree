"use client"

import { useMemo, useState } from "react"
import { SearchIcon } from "lucide-react"

import { PersonSummaryRow } from "@/components/silsilah/person-summary-row"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { normalizeName } from "@/lib/normalize-name"
import { genderCardClass } from "@/lib/silsilah/person-display"
import { cn } from "@/lib/utils"
import type { Person } from "@prisma/client"

type PersonNameListProps = {
  activePersonId?: string
  onAddPerson?: () => void
  onPersonSelect: (personId: string) => void
  persons: Person[]
}

function personMatchesQuery(person: Person, query: string) {
  const normalized = normalizeName(query)

  if (!normalized) {
    return true
  }

  return normalizeName(person.fullName).includes(normalized)
}

export function PersonNameList({
  activePersonId,
  onAddPerson,
  onPersonSelect,
  persons,
}: PersonNameListProps) {
  const [query, setQuery] = useState("")

  const filteredPersons = useMemo(
    () => persons.filter((person) => personMatchesQuery(person, query)),
    [persons, query],
  )

  if (persons.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-4 text-sm">
        <p className="text-muted-foreground">Belum ada anggota.</p>
        {onAddPerson ? (
          <Button onClick={onAddPerson} size="sm" type="button" variant="outline">
            Tambah Anggota
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b px-2 py-1.5 lg:py-2">
        <div className="relative">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 lg:left-2.5 lg:size-4" />
          <Input
            aria-label="Cari anggota keluarga"
            className="h-8 pl-7 text-sm lg:h-9 lg:pl-8"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama…"
            type="search"
            value={query}
          />
        </div>
        {query.trim() ? (
          <p className="text-muted-foreground mt-1.5 px-0.5 text-2.75">
            {filteredPersons.length} dari {persons.length} anggota
          </p>
        ) : null}
      </div>

      {filteredPersons.length === 0 ? (
        <p className="text-muted-foreground shrink-0 px-4 py-6 text-center text-sm">
          Tidak ada anggota dengan nama &quot;{query.trim()}&quot;.
        </p>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain p-1.5 lg:gap-2 lg:p-2">
          {filteredPersons.map((person) => {
            const isActive = person.id === activePersonId

            return (
              <li key={person.id}>
                <button
                  className={cn(
                    "block w-full rounded-lg border text-left transition-[filter,box-shadow,transform]",
                    genderCardClass(person.gender),
                    "px-2 py-1.5 active:brightness-[0.97]",
                    "lg:rounded-xl lg:px-3 lg:py-2.5 lg:shadow-sm lg:transition-all lg:hover:-translate-y-0.5 lg:hover:shadow-md",
                    isActive &&
                      "border-primary/45 ring-1 ring-primary/30 lg:ring-2",
                  )}
                  onClick={() => onPersonSelect(person.id)}
                  type="button"
                >
                  <PersonSummaryRow
                    birthDate={person.birthDate}
                    deathDate={person.deathDate}
                    gender={person.gender}
                    isAlive={person.isAlive}
                    name={person.fullName}
                    photoUrl={person.photoUrl}
                    variant="sidebar"
                  />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
