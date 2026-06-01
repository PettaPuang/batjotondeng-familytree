"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import type { PersonAuditLog } from "@prisma/client"

import { PersonAddSheet } from "@/components/silsilah/person-form-sheet"
import { SilsilahExplorerClient } from "@/components/silsilah/silsilah-explorer-client"
import type { CreatePersonRelationOption } from "@/lib/auth/create-person-options"
import {
  fetchPersonAuditLogsAction,
  fetchPersonDetailAction,
} from "@/lib/actions/silsilah.actions"
import type { PersonDetailPayload } from "@/lib/silsilah/types"
import { buildSilsilahUrl } from "@/lib/silsilah/format"
import {
  hydrateTreePersons,
  type SilsilahTreePayload,
} from "@/lib/silsilah/tree"

type SilsilahPageClientProps = {
  treePayload: SilsilahTreePayload
  subjectPersonId?: string
  createOptions: CreatePersonRelationOption
  manageablePersonIds: string[]
  initialSelectedPersonId: string | null
  initialAuditOpen: boolean
  viewAll: boolean
}

export function SilsilahPageClient({
  treePayload,
  subjectPersonId,
  createOptions,
  manageablePersonIds,
  initialSelectedPersonId,
  initialAuditOpen,
  viewAll,
}: SilsilahPageClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [addOpen, setAddOpen] = useState(false)
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(
    initialSelectedPersonId,
  )
  const [auditOpen, setAuditOpen] = useState(initialAuditOpen)
  const [personDetail, setPersonDetail] = useState<PersonDetailPayload | null>(
    null,
  )
  const [personDetailError, setPersonDetailError] = useState<string | null>(
    null,
  )
  const [auditLogs, setAuditLogs] = useState<PersonAuditLog[] | null>(null)
  const [auditError, setAuditError] = useState<string | null>(null)

  const { persons, treePersons } = useMemo(
    () => ({
      persons: treePayload.persons,
      treePersons: hydrateTreePersons(treePayload),
    }),
    [treePayload],
  )

  const syncUrl = useCallback(
    (personId: string | null, nextAuditOpen: boolean) => {
      const url = buildSilsilahUrl(pathname, {
        personId,
        audit: nextAuditOpen,
        viewAll,
      })

      window.history.replaceState(null, "", url)
    },
    [pathname, viewAll],
  )

  useEffect(() => {
    if (!selectedPersonId) {
      setPersonDetail(null)
      setPersonDetailError(null)
      return
    }

    let cancelled = false

    setPersonDetail(null)
    setPersonDetailError(null)

    void fetchPersonDetailAction(selectedPersonId).then((result) => {
      if (cancelled) {
        return
      }

      setPersonDetail(result.detail)
      setPersonDetailError(result.error)
    })

    return () => {
      cancelled = true
    }
  }, [selectedPersonId])

  useEffect(() => {
    if (!selectedPersonId || !auditOpen) {
      setAuditLogs(null)
      setAuditError(null)
      return
    }

    let cancelled = false

    setAuditLogs(null)
    setAuditError(null)

    void fetchPersonAuditLogsAction(selectedPersonId).then((result) => {
      if (cancelled) {
        return
      }

      setAuditLogs(result.logs)
      setAuditError(result.error)
    })

    return () => {
      cancelled = true
    }
  }, [auditOpen, selectedPersonId])

  const handlePersonUpdated = useCallback(() => {
    if (selectedPersonId) {
      void fetchPersonDetailAction(selectedPersonId).then((result) => {
        setPersonDetail(result.detail)
        setPersonDetailError(result.error)
      })
    }

    router.refresh()
  }, [router, selectedPersonId])

  const handlePersonCreated = useCallback(
    (personId: string) => {
      setSelectedPersonId(personId)
      setAuditOpen(false)
      syncUrl(personId, false)
      router.refresh()
    },
    [router, syncUrl],
  )

  const handleOpenPerson = useCallback(
    (personId: string) => {
      setSelectedPersonId(personId)
      setAuditOpen(false)
      syncUrl(personId, false)
    },
    [syncUrl],
  )

  const handleClosePerson = useCallback(() => {
    setSelectedPersonId(null)
    setAuditOpen(false)
    syncUrl(null, false)
  }, [syncUrl])

  const handleAuditOpenChange = useCallback(
    (open: boolean) => {
      if (!selectedPersonId) {
        return
      }

      setAuditOpen(open)
      syncUrl(selectedPersonId, open)
    },
    [selectedPersonId, syncUrl],
  )

  const handleViewToggle = useCallback(
    (checked: boolean) => {
      router.push(
        buildSilsilahUrl(pathname, {
          personId: selectedPersonId,
          audit: auditOpen,
          viewAll: checked,
        }),
      )
    },
    [auditOpen, pathname, router, selectedPersonId],
  )

  return (
    <>
      <SilsilahExplorerClient
        auditError={auditError}
        auditLogs={auditLogs}
        auditOpen={auditOpen}
        manageablePersonIds={manageablePersonIds}
        memberCount={persons.length}
        onAddPerson={() => setAddOpen(true)}
        onAuditOpenChange={handleAuditOpenChange}
        onClosePerson={handleClosePerson}
        onOpenPerson={handleOpenPerson}
        onPersonUpdated={handlePersonUpdated}
        personDetail={personDetail}
        personDetailError={personDetailError}
        persons={persons}
        selectedPersonId={selectedPersonId}
        subjectPersonId={subjectPersonId}
        treePersons={treePersons}
        viewAll={viewAll}
        onViewToggle={handleViewToggle}
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
