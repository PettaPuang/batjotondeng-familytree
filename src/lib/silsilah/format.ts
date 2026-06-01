import type { Gender } from "@prisma/client"

export function formatDate(date: Date | string | null | undefined) {
  if (!date) {
    return "—"
  }

  const value = typeof date === "string" ? new Date(date) : date

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(value)
}

/** Format ringkas untuk kartu sempit (mobile / pohon silsilah). */
export function formatDateCompact(date: Date | string | null | undefined) {
  const normalized = toBirthDate(date)

  if (!normalized) {
    return "—"
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(normalized)
    .replace(/\./g, "")
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) {
    return "—"
  }

  const value = typeof date === "string" ? new Date(date) : date

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(value)
}

export function formatOptionalText(value: string | null | undefined) {
  if (!value?.trim()) {
    return "—"
  }

  return value
}

export function toDateInputValue(date: Date | string | null | undefined) {
  const normalized = toBirthDate(date)

  if (!normalized) {
    return ""
  }

  const year = normalized.getUTCFullYear()
  const month = String(normalized.getUTCMonth() + 1).padStart(2, "0")
  const day = String(normalized.getUTCDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export function parseDateInput(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const [year, month, day] = value.split("-").map(Number)

  if (!year || !month || !day) {
    return null
  }

  return new Date(Date.UTC(year, month - 1, day))
}

/** Untuk tampilan Calendar shadcn dari nilai YYYY-MM-DD. */
export function inputValueToCalendarDate(value: string | null | undefined) {
  const parsed = parseDateInput(value)

  if (!parsed) {
    return undefined
  }

  return new Date(
    parsed.getUTCFullYear(),
    parsed.getUTCMonth(),
    parsed.getUTCDate(),
  )
}

/** Dari tanggal yang dipilih di Calendar ke nilai YYYY-MM-DD. */
export function calendarDateToInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export function genderLabel(gender: "MALE" | "FEMALE") {
  return gender === "MALE" ? "Laki-laki" : "Perempuan"
}

export function formatAge(age: number | null | undefined): string | null {
  if (age === null || age === undefined) {
    return null
  }

  return `${age} thn`
}

export function formatAgeLong(age: number | null | undefined): string | null {
  if (age === null || age === undefined) {
    return null
  }

  return `${age} Tahun`
}

export function formatPersonCardSubtitle(
  nickname: string | null | undefined,
  age: number | null | undefined,
): string | null {
  const trimmedNickname = nickname?.trim()
  const ageLabel = formatAgeLong(age)

  if (trimmedNickname && ageLabel) {
    return `${trimmedNickname}, ${ageLabel}`
  }

  if (trimmedNickname) {
    return trimmedNickname
  }

  return ageLabel
}

function toBirthDate(date: Date | string | null | undefined) {
  if (!date) {
    return null
  }

  if (typeof date === "string") {
    return parseDateInput(date.slice(0, 10)) ?? new Date(date)
  }

  return date
}

export function calculateAge(
  birthDate: Date | string | null | undefined,
  referenceDate?: Date | string | null | undefined,
) {
  const birth = toBirthDate(birthDate)

  if (!birth) {
    return null
  }

  const reference = referenceDate ? toBirthDate(referenceDate) : new Date()

  if (!reference) {
    return null
  }

  let age = reference.getUTCFullYear() - birth.getUTCFullYear()
  const monthDiff = reference.getUTCMonth() - birth.getUTCMonth()
  const dayDiff = reference.getUTCDate() - birth.getUTCDate()

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1
  }

  return age >= 0 ? age : null
}

type FormatBirthWithAgeOptions = {
  isAlive?: boolean
  deathDate?: Date | string | null
  compact?: boolean
}

export function getDisplayAge(
  birthDate: Date | string | null | undefined,
  options?: Pick<FormatBirthWithAgeOptions, "deathDate" | "isAlive">,
) {
  const birth = toBirthDate(birthDate)

  if (!birth) {
    return null
  }

  const isAlive = options?.isAlive ?? true
  const ageReference =
    !isAlive && options?.deathDate
      ? options.deathDate
      : isAlive
        ? undefined
        : null

  if (ageReference === null) {
    return null
  }

  return calculateAge(birth, ageReference)
}

export function formatBirthWithAge(
  birthDate: Date | string | null | undefined,
  options?: FormatBirthWithAgeOptions,
) {
  const birth = toBirthDate(birthDate)

  if (!birth) {
    return "—"
  }

  const formatted = options?.compact ? formatDateCompact(birth) : formatDate(birth)
  const age = getDisplayAge(birthDate, options)

  if (age === null) {
    return formatted
  }

  return `${formatted} (${age} thn)`
}

export function getPersonInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return "?"
  }

  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase()
  }

  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

export function genderAvatarClass(gender: Gender) {
  return gender === "MALE"
    ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200"
    : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200"
}

/** Latar kartu anggota — nuansa sama dengan avatar, tetap terbaca saat ada foto */
export function genderCardClass(gender: Gender) {
  return gender === "MALE"
    ? "border-sky-200/80 bg-sky-50 dark:border-sky-800/70 dark:bg-sky-950/50"
    : "border-rose-200/80 bg-rose-50 dark:border-rose-800/70 dark:bg-rose-950/50"
}

export function deceasedNamePrefix(gender: Gender, isAlive: boolean) {
  if (isAlive) {
    return ""
  }

  return gender === "MALE" ? "(alm) " : "(almh) "
}

export function deceasedCheckboxLabel(gender: Gender | "") {
  if (gender === "MALE") {
    return "Almarhum"
  }

  if (gender === "FEMALE") {
    return "Almarhumah"
  }

  return "Almarhum/Almarhumah"
}

export function formatPersonTreeName(
  name: string,
  gender: Gender,
  isAlive: boolean,
) {
  return `${deceasedNamePrefix(gender, isAlive)}${name}`
}

export function buildSilsilahUrl(
  pathname: string,
  options?: {
    personId?: string | null
    audit?: boolean
    viewAll?: boolean
  },
) {
  const params = new URLSearchParams()

  if (options?.viewAll) {
    params.set("view", "all")
  }

  if (options?.personId) {
    params.set("person", options.personId)
  }

  if (options?.audit && options.personId) {
    params.set("audit", "1")
  }

  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}

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

// --- Name normalization ---

const UNICODE_SPACES = /[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g

function cleanToken(token: string) {
  return token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")
}

/** Normalisasi nama: spasi berlebih, huruf kapital, tanda baca di ujung kata. */
export function normalizeName(name: string) {
  return name
    .normalize("NFKC")
    .replace(UNICODE_SPACES, " ")
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map(cleanToken)
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("id")
}

export function namesMatch(a: string, b: string) {
  return normalizeName(a) === normalizeName(b)
}
