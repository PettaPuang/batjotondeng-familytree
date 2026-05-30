"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { PersonAddSheet } from "@/components/silsilah/person-form-sheet"
import {
  SilsilahExplorer,
  type SilsilahExplorerHandle,
} from "@/components/silsilah/silsilah-explorer"
import type { CreatePersonRelationOption } from "@/lib/auth/create-person-options"
import type { SilsilahTreePayload } from "@/lib/silsilah/tree-graph"
import { hydrateTreePersons } from "@/lib/silsilah/tree-graph"

type SilsilahPageContentProps = {
  treePayload: SilsilahTreePayload
  subjectPersonId?: string
  createOptions: CreatePersonRelationOption
  manageablePersonIds: string[]
}

export function SilsilahPageContent({
  treePayload,
  subjectPersonId,
  createOptions,
  manageablePersonIds,
}: SilsilahPageContentProps) {
  const router = useRouter()
  const explorerRef = useRef<SilsilahExplorerHandle>(null)
  const [addOpen, setAddOpen] = useState(false)

  const { persons, treePersons } = useMemo(
    () => ({
      persons: treePayload.persons,
      treePersons: hydrateTreePersons(treePayload),
    }),
    [treePayload],
  )

  const handlePersonUpdated = useCallback(() => {
    router.refresh()
  }, [router])

  const handlePersonCreated = useCallback(
    (personId: string) => {
      router.refresh()
      explorerRef.current?.openPerson(personId)
    },
    [router],
  )

  return (
    <>
      <SilsilahExplorer
        manageablePersonIds={manageablePersonIds}
        memberCount={persons.length}
        onAddPerson={() => setAddOpen(true)}
        onPersonUpdated={handlePersonUpdated}
        persons={persons}
        ref={explorerRef}
        subjectPersonId={subjectPersonId}
        treePersons={treePersons}
      />

      <PersonAddSheet
        createOptions={createOptions}
        onOpenChange={setAddOpen}
        onSuccess={handlePersonCreated}
        open={addOpen}
      />
    </>
  )
}
