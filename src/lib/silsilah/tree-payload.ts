import "server-only"

import { prisma } from "@/lib/prisma"
import type { SilsilahTreePayload } from "@/lib/silsilah/tree-graph"

export type { MarriageTreeRecord, ParentLinkRecord, SilsilahTreePayload } from "@/lib/silsilah/tree-graph"
export { hydrateTreePersons } from "@/lib/silsilah/tree-graph"

export async function getSilsilahTreePayload(): Promise<SilsilahTreePayload> {
  const [persons, marriages, parentLinks] = await Promise.all([
    prisma.person.findMany({ orderBy: { fullName: "asc" } }),
    prisma.marriage.findMany({
      include: { children: { select: { childId: true } } },
    }),
    prisma.personParent.findMany({
      select: { childId: true, marriageId: true },
    }),
  ])

  return {
    persons,
    marriages: marriages.map((marriage) => ({
      id: marriage.id,
      husbandId: marriage.husbandId,
      wifeId: marriage.wifeId,
      marriageDate: marriage.marriageDate,
      isActive: marriage.isActive,
      childIds: marriage.children.map((link) => link.childId),
    })),
    parentLinks,
  }
}
