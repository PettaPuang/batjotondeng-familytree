"use client"

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from "react"

import { GenealogyTree } from "@/components/silsilah/genealogy-tree"
import { PersonDetailSheet } from "@/components/silsilah/person-detail-sheet"
import { PersonNameList } from "@/components/silsilah/person-name-list"
import { Button } from "@/components/ui/button"
import type { TreeNodePerson, TreePerson } from "@/lib/silsilah/types"

export type SilsilahExplorerHandle = {
  openPerson: (personId: string) => void
}

type SilsilahExplorerProps = {
  persons: TreeNodePerson[]
  memberCount: number
  subjectPersonId?: string
  treePersons: TreePerson[]
  manageablePersonIds: string[]
  onAddPerson?: () => void
  onPersonUpdated?: () => void
}

export const SilsilahExplorer = forwardRef<
  SilsilahExplorerHandle,
  SilsilahExplorerProps
>(function SilsilahExplorer(
  {
    persons,
    memberCount,
    subjectPersonId,
    treePersons,
    manageablePersonIds,
    onAddPerson,
    onPersonUpdated,
  },
  ref,
) {
  const [treeFocusPersonId, setTreeFocusPersonId] = useState<string | null>(
    () => subjectPersonId ?? null,
  )
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const manageableSet = useMemo(
    () => new Set(manageablePersonIds),
    [manageablePersonIds],
  )

  const focusTree = useCallback((personId: string) => {
    setTreeFocusPersonId(personId)
  }, [])

  const openPerson = useCallback((personId: string) => {
    setSelectedPersonId(personId)
    setSheetOpen(true)
  }, [])

  useImperativeHandle(ref, () => ({ openPerson }), [openPerson])

  const handleOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open)

    if (!open) {
      setSelectedPersonId(null)
    }
  }, [])

  return (
    <>
      <div className="grid min-h-0 flex-1 gap-4 max-lg:grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-5">
        <aside className="bg-card flex max-lg:max-h-[min(32vh,14rem)] min-h-0 flex-col overflow-hidden rounded-2xl border shadow-sm lg:h-full">
          <div className="bg-muted/40 flex shrink-0 items-center justify-between border-b px-3 py-2 lg:px-4 lg:py-3">
            <h2 className="text-xs font-medium lg:text-sm">Daftar Anggota</h2>
            <span className="text-muted-foreground text-sm tabular-nums">{memberCount}</span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <PersonNameList
              activePersonId={treeFocusPersonId ?? subjectPersonId ?? undefined}
              onAddPerson={onAddPerson}
              onPersonSelect={focusTree}
              persons={persons}
            />
          </div>
        </aside>

        <div className="bg-card flex min-h-0 flex-col overflow-hidden rounded-2xl border shadow-sm lg:h-full">
          <div className="bg-muted/40 flex items-center justify-between gap-3 border-b px-4 py-3">
            <h2 className="text-sm font-medium">Pohon Silsilah</h2>
            {onAddPerson ? (
              <Button onClick={onAddPerson} size="sm" type="button">
                Tambah Anggota
              </Button>
            ) : null}
          </div>
          <div className="flex min-h-0 flex-1 p-2 sm:p-4">
            <div className="h-full min-h-0 w-full">
            <GenealogyTree
              focusPersonId={treeFocusPersonId}
              onPersonSelect={openPerson}
              persons={treePersons}
              selfPersonId={subjectPersonId}
            />
            </div>
          </div>
        </div>
      </div>

      <PersonDetailSheet
        canManage={
          selectedPersonId ? manageableSet.has(selectedPersonId) : false
        }
        onOpenChange={handleOpenChange}
        onPersonUpdated={onPersonUpdated}
        open={sheetOpen}
        personId={selectedPersonId}
      />
    </>
  )
})
