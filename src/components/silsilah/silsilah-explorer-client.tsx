"use client"

import { useCallback, useMemo, useState } from "react"
import type { PersonAuditLog } from "@prisma/client"
import { SearchIcon } from "lucide-react"

import { GenealogyTree } from "@/components/silsilah/genealogy-tree"
import { PersonDetailSheet } from "@/components/silsilah/person-detail-sheet"
import { SignOutButton } from "@/components/sign-out-button"
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
  userName?: string
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
  userName,
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
      <div className="relative h-full w-full overflow-hidden bg-card">
        <div className="absolute inset-x-0 bottom-0 top-14 z-0">
          <GenealogyTree
            focusPersonId={treeFocusPersonId}
            onPersonSelect={onOpenPerson}
            persons={treePersons}
            selfPersonId={subjectPersonId}
          />
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-30">
          <div className="pointer-events-auto flex h-14 items-center justify-between gap-3 border-b bg-background/90 px-4 backdrop-blur-md sm:px-6">
            <div className="min-w-0 flex-1">
              <h1 className="font-heading truncate text-sm font-semibold">
                Silsilah Keluarga Puang Batjo Tondeng
              </h1>
              {userName ? (
                <p className="text-muted-foreground truncate text-xs">
                  Selamat datang, {userName}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {onAddPerson ? (
                <Button onClick={onAddPerson} size="sm" type="button">
                  Tambah Anggota
                </Button>
              ) : null}
              <SignOutButton />
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute left-2 top-16 z-20">
          <div className="bg-card/90 pointer-events-auto flex w-56 flex-col gap-1.5 rounded-md border p-2 shadow-sm backdrop-blur-sm sm:w-68">
            <Popover onOpenChange={setSearchOpen} open={showSearchResults}>
              <PopoverAnchor asChild>
                <div className="relative">
                  <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2" />
                  <Input
                    aria-label="Cari anggota keluarga"
                    className="pl-7"
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
                className="w-(--radix-popover-trigger-width) p-1"
                onOpenAutoFocus={(event) => event.preventDefault()}
                side="bottom"
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
                              "hover:bg-muted/70 flex min-h-[44px] w-full flex-col justify-center rounded-md px-2 py-3 text-left transition-colors",
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
            <div className="-mx-2 h-px bg-border" />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <label
                className="text-muted-foreground flex cursor-pointer items-center gap-1.5 text-xs whitespace-nowrap select-none"
                htmlFor="view-all-toggle"
              >
                <Switch
                  checked={viewAll}
                  id="view-all-toggle"
                  onCheckedChange={onViewToggle}
                  size="sm"
                />
                Tampilkan semua
              </label>
              <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                {memberCount} anggota
              </span>
            </div>
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
