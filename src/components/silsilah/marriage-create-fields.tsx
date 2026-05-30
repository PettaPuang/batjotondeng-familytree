"use client"

import { useState } from "react"

import { FormSelectField } from "@/components/silsilah/form-select-field"
import { Field, FieldLabel } from "@/components/ui/field"

type PersonOption = {
  id: string
  fullName: string
}

type MarriageCreateFieldsProps = {
  husbands: PersonOption[]
  wives: PersonOption[]
}

export function MarriageCreateFields({ husbands, wives }: MarriageCreateFieldsProps) {
  const [husbandId, setHusbandId] = useState("")
  const [wifeId, setWifeId] = useState("")

  return (
    <>
      <Field>
        <FieldLabel htmlFor="husbandId">Suami</FieldLabel>
        <FormSelectField
          id="husbandId"
          name="husbandId"
          onValueChange={setHusbandId}
          options={husbands.map((person) => ({
            value: person.id,
            label: person.fullName,
          }))}
          placeholder="Pilih suami"
          required
          value={husbandId}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="wifeId">Istri</FieldLabel>
        <FormSelectField
          id="wifeId"
          name="wifeId"
          onValueChange={setWifeId}
          options={wives.map((person) => ({
            value: person.id,
            label: person.fullName,
          }))}
          placeholder="Pilih istri"
          required
          value={wifeId}
        />
      </Field>
    </>
  )
}
