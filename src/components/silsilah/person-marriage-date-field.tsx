"use client"

import { DatePickerField } from "@/components/silsilah/date-picker-field"
import { Field, FieldLabel } from "@/components/ui/field"
import type { PersonWithRelations } from "@/lib/silsilah/types"

function primaryMarriage(person: PersonWithRelations) {
  const seen = new Set<string>()

  for (const marriage of [...person.marriages, ...person.marriages2]) {
    if (seen.has(marriage.id)) {
      continue
    }

    seen.add(marriage.id)

    if (marriage.isActive) {
      return marriage
    }
  }

  return person.marriages[0] ?? person.marriages2[0] ?? null
}

type PersonMarriageDateFieldProps = {
  person: PersonWithRelations
  idPrefix?: string
}

export function PersonMarriageDateField({
  person,
  idPrefix = "edit-",
}: PersonMarriageDateFieldProps) {
  const marriage = primaryMarriage(person)

  if (!marriage) {
    return null
  }

  const wife = "wife" in marriage ? marriage.wife : null
  const husband = "husband" in marriage ? marriage.husband : null
  const spouseName =
    marriage.husbandId === person.id
      ? (wife?.fullName ?? "Pasangan")
      : (husband?.fullName ?? "Pasangan")

  return (
    <Field>
      <FieldLabel htmlFor={`${idPrefix}marriageDate`}>
        Tanggal pernikahan ({spouseName})
      </FieldLabel>
      <input name="marriageId" type="hidden" value={marriage.id} />
      <DatePickerField
        defaultValue={marriage.marriageDate}
        id={`${idPrefix}marriageDate`}
        name="marriageDate"
        placeholder="Opsional"
      />
    </Field>
  )
}
