import type { Gender } from "@prisma/client"

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
