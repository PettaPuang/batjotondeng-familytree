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
}

export function formatBirthWithAge(
  birthDate: Date | string | null | undefined,
  options?: FormatBirthWithAgeOptions,
) {
  const birth = toBirthDate(birthDate)

  if (!birth) {
    return "—"
  }

  const formatted = formatDate(birth)
  const isAlive = options?.isAlive ?? true
  const ageReference =
    !isAlive && options?.deathDate
      ? options.deathDate
      : isAlive
        ? undefined
        : null
  const age =
    ageReference === null ? null : calculateAge(birth, ageReference)

  if (age === null) {
    return formatted
  }

  return `${formatted} (${age} th)`
}
