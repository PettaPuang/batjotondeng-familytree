import type { Gender, Marriage, Person, PersonParent } from "@prisma/client"

import { formatPersonTreeName } from "@/lib/silsilah/format"
import type { PersonViewerContext } from "@/lib/silsilah/person-relation-context"
import type { PersonDetailResult } from "@/lib/services/silsilah.service"

/** Data terbatas untuk viewer tanpa izin kelola (client-safe). */
export type PersonDetailLimited = {
  id: string
  fullName: string
  nickname: string | null
  gender: Gender
  isAlive: boolean
  photoUrl: string | null
  age: number | null
  phone: string | null
  address: string | null
}

export type PersonWithRelations = Person & {
  marriages: (Marriage & {
    wife: Person
    children: (PersonParent & { child: Person })[]
  })[]
  marriages2: (Marriage & {
    husband: Person
    children: (PersonParent & { child: Person })[]
  })[]
  parents: (PersonParent & {
    marriage: Marriage & {
      husband: Person
      wife: Person
    }
  })[]
}

/** Data publik per orang untuk render pohon/daftar (tanpa field sensitif). */
export type TreeNodePerson = {
  id: string
  fullName: string
  nickname: string | null
  gender: Gender
  isAlive: boolean
  photoUrl: string | null
  age: number | null
  birthOrder: number | null
}

type TreeNodeMarriage = {
  id: string
  husbandId: string
  wifeId: string
  isActive: boolean
  husband: TreeNodePerson
  wife: TreeNodePerson
  children: { id: string; childId: string; marriageId: string; child: TreeNodePerson }[]
}

export type TreePerson = TreeNodePerson & {
  marriages: TreeNodeMarriage[]
  marriages2: TreeNodeMarriage[]
  parents: {
    id: string
    childId: string
    marriageId: string
    marriage: {
      id: string
      husbandId: string
      wifeId: string
      isActive: boolean
      husband: TreeNodePerson
      wife: TreeNodePerson
    }
  }[]
}

export type PersonDetailPayload =
  | {
      access: "full"
      person: PersonWithRelations
      viewerContext: PersonViewerContext | null
    }
  | { access: "limited"; person: PersonDetailLimited }

export function normalizePersonDates<T extends Person>(person: T): T {
  return {
    ...person,
    birthDate: person.birthDate ? new Date(person.birthDate) : null,
    deathDate: person.deathDate ? new Date(person.deathDate) : null,
    createdAt: new Date(person.createdAt),
    updatedAt: new Date(person.updatedAt),
  }
}

export function normalizePersonWithRelations(
  person: PersonWithRelations,
): PersonWithRelations {
  return normalizePersonDates(person)
}

export function toPersonDetailPayload(
  detail: PersonDetailResult,
): PersonDetailPayload {
  if (detail.access === "limited") {
    return detail
  }

  return {
    access: "full",
    person: normalizePersonWithRelations(detail.person),
    viewerContext: detail.viewerContext,
  }
}

export function getPersonDetailTitle(payload: PersonDetailPayload) {
  return formatPersonTreeName(
    payload.person.fullName,
    payload.person.gender,
    payload.person.isAlive,
  )
}
