import { sortBySiblingBirthOrder } from "@/lib/silsilah/sibling-order"
import type { PersonWithRelations } from "@/lib/silsilah/types"

export function getChildrenFromPerson(person: PersonWithRelations) {
  const marriages = [...person.marriages, ...person.marriages2]
  const childrenMap = new Map<
    string,
    (typeof marriages)[number]["children"][number]["child"]
  >()

  for (const marriage of marriages) {
    for (const link of marriage.children) {
      childrenMap.set(link.child.id, link.child)
    }
  }

  return sortBySiblingBirthOrder(Array.from(childrenMap.values()))
}

export function getRootPersons(persons: PersonWithRelations[]) {
  return persons.filter((person) => person.parents.length === 0)
}
