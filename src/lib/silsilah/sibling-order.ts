/** Urutan saudara/anak kiri→kanan: tanggal lahir naik, tanpa tanggal di akhir, lalu nama. */
export function compareSiblingBirthOrder<
  T extends { birthDate: Date | null | undefined; fullName: string },
>(a: T, b: T): number {
  const aTime = a.birthDate?.getTime()
  const bTime = b.birthDate?.getTime()

  if (aTime !== undefined && bTime !== undefined) {
    if (aTime !== bTime) {
      return aTime - bTime
    }
  } else if (aTime !== undefined) {
    return -1
  } else if (bTime !== undefined) {
    return 1
  }

  return a.fullName.localeCompare(b.fullName, "id", { sensitivity: "base" })
}

export function sortBySiblingBirthOrder<
  T extends { birthDate: Date | null | undefined; fullName: string },
>(people: T[]): T[] {
  return [...people].sort(compareSiblingBirthOrder)
}
