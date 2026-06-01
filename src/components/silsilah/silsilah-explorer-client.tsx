"use client"

import { useCallback, useMemo, useState } from "react"
import type { PersonAuditLog } from "@prisma/client"
import { SearchIcon } from "lucide-react"

import { GenealogyTree } from "@/components/silsilah/genealogy-tree"
import { PersonDetailSheet } from "@/components/silsilah/person-detail-sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover"
import {
  formatAgeLong,
  formatPersonTreeName,
  normalizeName,
} from "@/lib/silsilah/format"
import { cn } from "@/lib/utils"
import type { PersonDetailPayload } from "@/lib/silsilah/types"
import type { TreeNodePerson, TreePerson } from "@/lib/silsilah/types"

type SilsilahExplorerClientProps = {
  persons: TreeNodePerson[]
  memberCount: number
  subjectPersonId?: string
  treePersons: TreePerson[]
  manageablePersonIds: string[]
  selectedPersonId: string | null
  personDetail: PersonDetailPayload | null
  personDetailError: string | null
  auditOpen: boolean
  auditLogs: PersonAuditLog[] | null
  auditError: string | null
  onAddPerson?: () => void
  onPersonUpdated?: () => void
  onOpenPerson: (personId: string) => void
  onClosePerson: () => void
  onAuditOpenChange: (open: boolean) => void
  viewAll: boolean
  onViewToggle: (checked: boolean) => void
}

const SEARCH_RESULT_LIMIT = 12

function personMatchesQuery(person: TreeNodePerson, query: string) {
  const normalized = normalizeName(query)

  if (!normalized) {
    return false
  }

  if (normalizeName(person.fullName).includes(normalized)) {
    return true
  }

  if (person.nickname && normalizeName(person.nickname).includes(normalized)) {
    return true
  }

  return false
}

export function SilsilahExplorerClient({
  persons,
  memberCount,
  subjectPersonId,
  treePersons,
  manageablePersonIds,
  selectedPersonId,
  personDetail,
  personDetailError,
  auditOpen,
  auditLogs,
  auditError,
  onAddPerson,
  onPersonUpdated,
  onOpenPerson,
  onClosePerson,
  onAuditOpenChange,
  viewAll,
  onViewToggle,
}: SilsilahExplorerClientProps) {
  const [treeFocusPersonId, setTreeFocusPersonId] = useState<string | null>(
    () => subjectPersonId ?? null,
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)

  const manageableSet = useMemo(
    () => new Set(manageablePersonIds),
    [manageablePersonIds],
  )

  const searchResults = useMemo(() => {
    const trimmed = searchQuery.trim()

    if (!trimmed) {
      return []
    }

    return persons
      .filter((person) => personMatchesQuery(person, trimmed))
      .slice(0, SEARCH_RESULT_LIMIT)
  }, [persons, searchQuery])

  const showSearchResults = searchOpen && searchQuery.trim().length > 0

  const handleSearchSelect = useCallback((personId: string) => {
    setSearchQuery("")
    setSearchOpen(false)
    setTreeFocusPersonId(personId)
  }, [])

  const sheetOpen = Boolean(selectedPersonId)

  const handleSheetOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClosePerson()
      }
    },
    [onClosePerson],
  )

  return (
    <>
      <div className="bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-sm">
        <div className="bg-muted/40 flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-md sm:flex-row sm:items-center">
            <Popover onOpenChange={setSearchOpen} open={showSearchResults}>
              <PopoverAnchor asChild>
                <div className="relative min-w-0 flex-1">
                  <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                  <Input
                    aria-label="Cari anggota keluarga"
                    className="h-9 pl-9"
                    onChange={(event) => {
                      setSearchQuery(event.target.value)
                      setSearchOpen(true)
                    }}
                    onFocus={() => setSearchOpen(true)}
                    placeholder="Cari nama atau panggilan…"
                    type="search"
                    value={searchQuery}
                  />
                </div>
              </PopoverAnchor>
              <PopoverContent
                align="start"
                className="w-[var(--radix-popover-trigger-width)] p-1"
                onOpenAutoFocus={(event) => event.preventDefault()}
              >
                {searchResults.length === 0 ? (
                  <p className="text-muted-foreground px-2 py-3 text-center text-sm">
                    Tidak ada anggota dengan &quot;{searchQuery.trim()}&quot;.
                  </p>
                ) : (
                  <ul className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
                    {searchResults.map((person) => {
                      const displayName = formatPersonTreeName(
                        person.fullName,
                        person.gender,
                        person.isAlive,
                      )
                      const ageLabel = formatAgeLong(person.age)

                      return (
                        <li key={person.id}>
                          <button
                            className={cn(
                              "hover:bg-muted/70 block w-full rounded-md px-2 py-1.5 text-left transition-colors",
                            )}
                            onClick={() => handleSearchSelect(person.id)}
                            type="button"
                          >
                            <p
                              className="truncate text-sm leading-snug font-medium"
                              title={displayName}
                            >
                              {displayName}
                            </p>
                            {ageLabel ? (
                              <p className="text-muted-foreground text-xs leading-tight tabular-nums">
                                {ageLabel}
                              </p>
                            ) : null}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-3 sm:justify-end">
            <div className="flex items-center gap-2">
              <Switch
                checked={viewAll}
                id="view-all-toggle"
                onCheckedChange={onViewToggle}
              />
              <label
                className="text-muted-foreground cursor-pointer text-sm"
                htmlFor="view-all-toggle"
              >
                Tampilkan semua silsilah
              </label>
            </div>
            <span className="text-muted-foreground shrink-0 text-sm tabular-nums">
              {memberCount} anggota
            </span>

            {onAddPerson ? (
              <Button
                className="shrink-0"
                onClick={onAddPerson}
                size="sm"
                type="button"
              >
                Tambah Anggota
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 p-2 sm:p-4">
          <div className="h-full min-h-0 w-full">
            <GenealogyTree
              focusPersonId={treeFocusPersonId}
              onPersonSelect={onOpenPerson}
              persons={treePersons}
              selfPersonId={subjectPersonId}
            />
          </div>
        </div>
      </div>

      <PersonDetailSheet
        auditError={auditError}
        auditLogs={auditLogs}
        auditOpen={auditOpen}
        canManage={
          selectedPersonId ? manageableSet.has(selectedPersonId) : false
        }
        onAuditOpenChange={onAuditOpenChange}
        onOpenChange={handleSheetOpenChange}
        onPersonUpdated={onPersonUpdated}
        open={sheetOpen}
        personDetail={personDetail}
        personDetailError={personDetailError}
        personId={selectedPersonId}
      />
    </>
  )
}
