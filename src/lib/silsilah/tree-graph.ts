import type { TreeNodePerson, TreePerson } from "@/lib/silsilah/types"

export type MarriageTreeRecord = {
  id: string
  husbandId: string
  wifeId: string
  isActive: boolean
  childIds: string[]
}

export type ParentLinkRecord = {
  childId: string
  marriageId: string
}

export type SilsilahTreePayload = {
  persons: TreeNodePerson[]
  marriages: MarriageTreeRecord[]
  parentLinks: ParentLinkRecord[]
}

function parentLinkId(childId: string, marriageId: string) {
  return `${childId}:${marriageId}`
}

type MarriageWithRelations = {
  id: string
  husbandId: string
  wifeId: string
  isActive: boolean
  husband: TreeNodePerson
  wife: TreeNodePerson
  children: { id: string; childId: string; marriageId: string; child: TreeNodePerson }[]
}

function buildMarriageRecord(
  record: MarriageTreeRecord,
  personById: Map<string, TreeNodePerson>,
): MarriageWithRelations {
  const husband = personById.get(record.husbandId)
  const wife = personById.get(record.wifeId)

  if (!husband || !wife) {
    throw new Error(`Marriage ${record.id} references missing person.`)
  }

  return {
    id: record.id,
    husbandId: record.husbandId,
    wifeId: record.wifeId,
    isActive: record.isActive,
    husband,
    wife,
    children: record.childIds.map((childId) => {
      const child = personById.get(childId)

      if (!child) {
        throw new Error(`Child ${childId} not found for marriage ${record.id}.`)
      }

      return {
        id: parentLinkId(childId, record.id),
        childId,
        marriageId: record.id,
        child,
      }
    }),
  }
}

/** Susun TreePerson[] dari payload datar (satu Person per id, tanpa duplikat JSON). */
export function hydrateTreePersons(payload: SilsilahTreePayload): TreePerson[] {
  const personById = new Map(payload.persons.map((person) => [person.id, person]))
  const marriageById = new Map(
    payload.marriages.map((marriage) => [marriage.id, marriage]),
  )

  const husbandMarriages = new Map<string, MarriageTreeRecord[]>()
  const wifeMarriages = new Map<string, MarriageTreeRecord[]>()
  const parentsByChild = new Map<string, ParentLinkRecord[]>()

  for (const marriage of payload.marriages) {
    const asHusband = husbandMarriages.get(marriage.husbandId) ?? []
    asHusband.push(marriage)
    husbandMarriages.set(marriage.husbandId, asHusband)

    const asWife = wifeMarriages.get(marriage.wifeId) ?? []
    asWife.push(marriage)
    wifeMarriages.set(marriage.wifeId, asWife)
  }

  for (const link of payload.parentLinks) {
    const links = parentsByChild.get(link.childId) ?? []
    links.push(link)
    parentsByChild.set(link.childId, links)
  }

  return payload.persons.map((person) => {
    const marriages = (husbandMarriages.get(person.id) ?? []).map((record) =>
      buildMarriageRecord(record, personById),
    )
    const marriages2 = (wifeMarriages.get(person.id) ?? []).map((record) =>
      buildMarriageRecord(record, personById),
    )

    const parents = (parentsByChild.get(person.id) ?? []).map((link) => {
      const record = marriageById.get(link.marriageId)

      if (!record) {
        throw new Error(`Marriage ${link.marriageId} not found for parent link.`)
      }

      const husband = personById.get(record.husbandId)
      const wife = personById.get(record.wifeId)

      if (!husband || !wife) {
        throw new Error(`Marriage ${record.id} references missing person.`)
      }

      return {
        id: parentLinkId(link.childId, link.marriageId),
        childId: link.childId,
        marriageId: link.marriageId,
        marriage: {
          id: record.id,
          husbandId: record.husbandId,
          wifeId: record.wifeId,
          isActive: record.isActive,
          husband,
          wife,
        },
      }
    })

    return {
      ...person,
      marriages,
      marriages2,
      parents,
    }
  })
}
