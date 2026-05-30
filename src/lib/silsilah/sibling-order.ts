type SiblingSortable = {
  birthOrder?: number | null
  birthDate?: Date | null
  fullName: string
}

function siblingSortKey(person: SiblingSortable): number | undefined {
  if (person.birthOrder !== undefined && person.birthOrder !== null) {
    return person.birthOrder
  }

  if (person.birthDate) {
    return person.birthDate.getTime()
  }

  return undefined
}

/** Urutan saudara/anak kiri→kanan: lebih awal lahir dahulu, tanpa data di akhir, lalu nama. */
export function compareSiblingBirthOrder<T extends SiblingSortable>(
  a: T,
  b: T,
): number {
  const aKey = siblingSortKey(a)
  const bKey = siblingSortKey(b)

  if (aKey !== undefined && bKey !== undefined) {
    if (aKey !== bKey) {
      return aKey - bKey
    }
  } else if (aKey !== undefined) {
    return -1
  } else if (bKey !== undefined) {
    return 1
  }

  return a.fullName.localeCompare(b.fullName, "id", { sensitivity: "base" })
}

export function sortBySiblingBirthOrder<T extends SiblingSortable>(
  people: T[],
): T[] {
  return [...people].sort(compareSiblingBirthOrder)
}
