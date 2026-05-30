import { prisma } from "@/lib/prisma"
import { normalizeName, namesMatch } from "@/lib/normalize-name"

export type VerifyPersonInput = {
  name: string
  parentName: string
  birthDate: string
}

export { normalizeName, namesMatch }

export function matchesBirthDate(stored: Date, input: string) {
  const [year, month, day] = input.split("-").map(Number)

  if (!year || !month || !day) {
    return false
  }

  return (
    stored.getUTCFullYear() === year &&
    stored.getUTCMonth() + 1 === month &&
    stored.getUTCDate() === day
  )
}

function nameParts(name: string) {
  return normalizeName(name).split(" ").filter(Boolean)
}

/** Cocokkan nama: kata apa pun dari nama lengkap, atau nama panggilan. */
function matchesIdentityName(
  input: string,
  fullName: string,
  nickname?: string | null,
) {
  const inputParts = nameParts(input)
  const fullParts = nameParts(fullName)

  if (inputParts.length === 0) {
    return false
  }

  if (nickname) {
    const nicknameParts = nameParts(nickname)

    if (namesMatch(input, nickname)) {
      return true
    }

    if (inputParts.length === 1 && nicknameParts.includes(inputParts[0])) {
      return true
    }
  }

  if (namesMatch(input, fullName)) {
    return true
  }

  if (inputParts.length >= 2 && fullParts.length >= 2) {
    const inputFirst = inputParts[0]
    const inputLast = inputParts[inputParts.length - 1]

    if (inputFirst !== fullParts[0]) {
      return false
    }

    return (
      inputLast === fullParts[fullParts.length - 1] ||
      fullParts.slice(1).includes(inputLast)
    )
  }

  if (inputParts.length === 1 && fullParts.length >= 1) {
    const word = inputParts[0]
    return fullParts.includes(word)
  }

  return false
}

export function matchesPersonName(
  input: string,
  fullName: string,
  nickname?: string | null,
) {
  return matchesIdentityName(input, fullName, nickname)
}

export function matchesParentName(
  input: string,
  fullName: string,
  nickname?: string | null,
) {
  return matchesIdentityName(input, fullName, nickname)
}

function parentInMarriageMatches(
  parentName: string,
  marriage: {
    husband: { fullName: string; nickname: string | null }
    wife: { fullName: string; nickname: string | null }
  },
) {
  return (
    matchesParentName(
      parentName,
      marriage.husband.fullName,
      marriage.husband.nickname,
    ) ||
    matchesParentName(parentName, marriage.wife.fullName, marriage.wife.nickname)
  )
}

function parseBirthDateInput(input: string) {
  const [year, month, day] = input.split("-").map(Number)

  if (!year || !month || !day) {
    return null
  }

  return new Date(Date.UTC(year, month - 1, day))
}

async function loadNameCandidates(name: string, birthDate?: Date) {
  const parts = nameParts(normalizeName(name))

  if (parts.length < 1) {
    return []
  }

  const nameFilter =
    parts.length === 1
      ? {
          OR: [
            { fullName: { contains: parts[0], mode: "insensitive" as const } },
            { nickname: { contains: parts[0], mode: "insensitive" as const } },
          ],
        }
      : {
          AND: parts.map((part) => ({
            OR: [
              { fullName: { contains: part, mode: "insensitive" as const } },
              { nickname: { contains: part, mode: "insensitive" as const } },
            ],
          })),
        }

  const results = await prisma.person.findMany({
    where: {
      ...(birthDate ? { birthDate } : {}),
      ...nameFilter,
    },
    include: {
      parents: {
        include: {
          marriage: {
            include: {
              husband: true,
              wife: true,
            },
          },
        },
      },
    },
  })

  return results.filter((person) =>
    matchesPersonName(name, person.fullName, person.nickname),
  )
}

export async function checkNameExists(name: string): Promise<boolean> {
  return (await loadNameCandidates(name)).length > 0
}

export async function checkParentExists(
  name: string,
  parentName: string,
): Promise<boolean> {
  const norm = normalizeName(parentName)

  if (!norm) {
    return false
  }

  const candidates = await loadNameCandidates(name)

  return candidates.some((person) =>
    person.parents.some(({ marriage }) =>
      parentInMarriageMatches(norm, marriage),
    ),
  )
}

export async function verifyPersonIdentity(input: VerifyPersonInput) {
  const birthDate = parseBirthDateInput(input.birthDate.trim())
  const trimmedParentName = normalizeName(input.parentName)

  if (!trimmedParentName || !birthDate) {
    return null
  }

  const candidates = await loadNameCandidates(input.name, birthDate)

  for (const person of candidates) {
    if (!person.birthDate || !matchesBirthDate(person.birthDate, input.birthDate)) {
      continue
    }

    const verified = person.parents.some(({ marriage }) =>
      parentInMarriageMatches(trimmedParentName, marriage),
    )

    if (verified) {
      return {
        id: person.id,
        fullName: person.fullName,
      }
    }
  }

  return null
}
