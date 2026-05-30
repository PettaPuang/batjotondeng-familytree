import type { Marriage, Person, PersonParent } from "@prisma/client"

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

export type TreePerson = PersonWithRelations
