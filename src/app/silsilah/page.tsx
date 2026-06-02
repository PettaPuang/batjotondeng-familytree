import type { Metadata } from "next"

import { auth } from "@/auth"
import { SilsilahPageClient } from "@/components/silsilah/silsilah-page-client"
import { getCreatePersonRelationOptions } from "@/lib/auth/create-person-options"
import { getManageablePersonIds } from "@/lib/auth/person-scope"
import { getSilsilahTreePayload } from "@/lib/services/silsilah.service"

export const metadata: Metadata = {
  title: "Silsilah",
}

type SilsilahPageProps = {
  searchParams: Promise<{ person?: string; audit?: string; view?: string }>
}

export default async function SilsilahPage({ searchParams }: SilsilahPageProps) {
  const session = await auth()
  const actorPersonId = session?.user?.personId
  const userName = session?.user?.name ?? undefined
  const { person: initialSelectedPersonId, audit, view } = await searchParams
  const viewAll = view === "all"
  const initialAuditOpen = audit === "1"

  const [createOptions, manageableIds] = await Promise.all([
    actorPersonId
      ? getCreatePersonRelationOptions(actorPersonId)
      : Promise.resolve({ marriages: [], parentMarriages: [] }),
    actorPersonId
      ? getManageablePersonIds(actorPersonId)
      : Promise.resolve(new Set<string>()),
  ])

  const treePayload = await getSilsilahTreePayload(
    viewAll ? undefined : manageableIds.size > 0 ? manageableIds : undefined,
  )

  return (
    <section className="h-full overflow-hidden">
      <SilsilahPageClient
        userName={userName}
        createOptions={createOptions}
        initialAuditOpen={initialAuditOpen}
        initialSelectedPersonId={initialSelectedPersonId ?? null}
        manageablePersonIds={[...manageableIds]}
        subjectPersonId={actorPersonId}
        treePayload={treePayload}
        viewAll={viewAll}
      />
    </section>
  )
}
