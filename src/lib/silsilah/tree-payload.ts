import "server-only"

import { getDisplayAge } from "@/lib/silsilah/format"
import { prisma } from "@/lib/prisma"
import type { TreeNodePerson } from "@/lib/silsilah/types"
import type { SilsilahTreePayload } from "@/lib/silsilah/tree-graph"

export type { MarriageTreeRecord, ParentLinkRecord, SilsilahTreePayload } from "@/lib/silsilah/tree-graph"
export { hydrateTreePersons } from "@/lib/silsilah/tree-graph"

function computeBirthOrder(
  persons: { id: string; birthDate: Date | null }[],
): Map<string, number> {
  const ordered = persons
    .filter((person): person is { id: string; birthDate: Date } =>
      person.birthDate !== null,
    )
    .sort((a, b) => a.birthDate.getTime() - b.birthDate.getTime())

  const map = new Map<string, number>()
  ordered.forEach((person, index) => map.set(person.id, index))
  return map
}

export async function getSilsilahTreePayload(): Promise<SilsilahTreePayload> {
  const [rawPersons, marriages, parentLinks] = await Promise.all([
    prisma.person.findMany({
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        gender: true,
        isAlive: true,
        photoUrl: true,
        birthDate: true,
        deathDate: true,
      },
    }),
    prisma.marriage.findMany({
      select: {
        id: true,
        husbandId: true,
        wifeId: true,
        isActive: true,
        children: { select: { childId: true } },
      },
    }),
    prisma.personParent.findMany({
      select: { childId: true, marriageId: true },
    }),
  ])

  const birthOrderById = computeBirthOrder(rawPersons)

  const persons: TreeNodePerson[] = rawPersons.map((person) => ({
    id: person.id,
    fullName: person.fullName,
    gender: person.gender,
    isAlive: person.isAlive,
    photoUrl: person.photoUrl,
    age: getDisplayAge(person.birthDate, {
      deathDate: person.deathDate,
      isAlive: person.isAlive,
    }),
    birthOrder: birthOrderById.get(person.id) ?? null,
  }))

  return {
    persons,
    marriages: marriages.map((marriage) => ({
      id: marriage.id,
      husbandId: marriage.husbandId,
      wifeId: marriage.wifeId,
      isActive: marriage.isActive,
      childIds: marriage.children.map((link) => link.childId),
    })),
    parentLinks,
  }
}
