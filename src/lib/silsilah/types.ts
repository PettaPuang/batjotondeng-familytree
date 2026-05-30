import type { Gender, Marriage, Person, PersonParent } from "@prisma/client"

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
