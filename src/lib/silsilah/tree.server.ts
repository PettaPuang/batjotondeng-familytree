import "server-only"

import { getDisplayAge } from "@/lib/silsilah/format"
import type { SilsilahTreePayload } from "@/lib/silsilah/tree"
import type { TreeNodePerson } from "@/lib/silsilah/types"
import { prisma } from "@/lib/prisma"

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

export async function getSilsilahTreePayload(
  filterIds?: Set<string>,
): Promise<SilsilahTreePayload> {
  const filterIdArray = filterIds ? [...filterIds] : undefined

  const [rawPersons, marriages, parentLinks] = await Promise.all([
    prisma.person.findMany({
      where: filterIdArray ? { id: { in: filterIdArray } } : undefined,
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        nickname: true,
        gender: true,
        isAlive: true,
        photoUrl: true,
        birthDate: true,
        deathDate: true,
      },
    }),
    prisma.marriage.findMany({
      where: filterIdArray
        ? { husbandId: { in: filterIdArray }, wifeId: { in: filterIdArray } }
        : undefined,
      select: {
        id: true,
        husbandId: true,
        wifeId: true,
        isActive: true,
        children: { select: { childId: true } },
      },
    }),
    prisma.personParent.findMany({
      where: filterIdArray ? { childId: { in: filterIdArray } } : undefined,
      select: { childId: true, marriageId: true },
    }),
  ])

  const marriageIdSet = new Set(marriages.map((m) => m.id))
  const filteredParentLinks = filterIdArray
    ? parentLinks.filter((link) => marriageIdSet.has(link.marriageId))
    : parentLinks

  const birthOrderById = computeBirthOrder(rawPersons)
  const personIdSet = new Set(rawPersons.map((p) => p.id))

  const persons: TreeNodePerson[] = rawPersons.map((person) => ({
    id: person.id,
    fullName: person.fullName,
    nickname: person.nickname,
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
      childIds: marriage.children
        .map((link) => link.childId)
        .filter((id) => personIdSet.has(id)),
    })),
    parentLinks: filteredParentLinks,
  }
}
