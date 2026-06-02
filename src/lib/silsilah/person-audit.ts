import {
  formatDate,
  formatOptionalText,
  genderLabel,
} from "@/lib/silsilah/format"

export const PERSON_AUDIT_FIELDS = [
  "fullName",
  "nickname",
  "gender",
  "birthDate",
  "birthPlace",
  "isAlive",
  "deathDate",
  "photoUrl",
  "phone",
  "address",
  "notes",
] as const

export type PersonAuditField = (typeof PERSON_AUDIT_FIELDS)[number]

export type PersonAuditFieldChange = {
  from: string | null
  to: string | null
}

export type PersonAuditPayload =
  | {
      kind: "create"
      fields: Record<PersonAuditField, string | null>
    }
  | {
      kind: "update"
      fields: Partial<Record<PersonAuditField, PersonAuditFieldChange>>
    }
  | {
      kind: "delete"
      fields: Record<PersonAuditField, string | null>
    }

export const PERSON_AUDIT_ACTION_LABELS = {
  CREATE: "Dibuat",
  UPDATE: "Diperbarui",
  DELETE: "Dihapus",
} as const

export function formatAuditDisplayValue(value: string | null) {
  return formatOptionalText(value)
}

function normalizeAuditValue(field: PersonAuditField, value: unknown) {
  if (value === null || value === undefined) {
    return null
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (field === "gender") {
    return genderLabel(value as "MALE" | "FEMALE")
  }

  if (field === "isAlive") {
    return value ? "Hidup" : "Meninggal"
  }

  if (field === "birthDate" || field === "deathDate") {
    return formatDate(value as Date | string)
  }

  return String(value)
}

export function serializePersonAuditFields(person: Record<PersonAuditField, unknown>) {
  return PERSON_AUDIT_FIELDS.reduce(
    (fields, field) => {
      fields[field] = normalizeAuditValue(field, person[field])
      return fields
    },
    {} as Record<PersonAuditField, string | null>,
  )
}

export function computePersonAuditChanges(
  before: Record<PersonAuditField, unknown>,
  after: Record<PersonAuditField, unknown>,
) {
  const changes: Partial<Record<PersonAuditField, PersonAuditFieldChange>> = {}

  for (const field of PERSON_AUDIT_FIELDS) {
    const from = normalizeAuditValue(field, before[field])
    const to = normalizeAuditValue(field, after[field])

    if (from !== to) {
      changes[field] = { from, to }
    }
  }

  return changes
}
