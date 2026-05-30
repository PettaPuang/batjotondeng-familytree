import { auth } from "@/auth"
import { SilsilahPageContent } from "@/components/silsilah/silsilah-page-content"
import { getCreatePersonRelationOptions } from "@/lib/auth/create-person-options"
import { getManageablePersonIds } from "@/lib/auth/person-scope"
import { getSilsilahTreePayload } from "@/lib/silsilah/queries"

export default async function SilsilahPage() {
  const session = await auth()
  const actorPersonId = session?.user?.personId

  const [treePayload, createOptions, manageableIds] = await Promise.all([
    getSilsilahTreePayload(),
    actorPersonId
      ? getCreatePersonRelationOptions(actorPersonId)
      : Promise.resolve({ marriages: [], parentMarriages: [] }),
    actorPersonId
      ? getManageablePersonIds(actorPersonId)
      : Promise.resolve(new Set<string>()),
  ])

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden">
      <SilsilahPageContent
        createOptions={createOptions}
        manageablePersonIds={[...manageableIds]}
        subjectPersonId={actorPersonId}
        treePayload={treePayload}
      />
    </section>
  )
}
