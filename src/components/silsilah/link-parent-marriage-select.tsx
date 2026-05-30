"use client"

import { useState } from "react"

import { FormSelectField } from "@/components/silsilah/form-select-field"

type MarriageOption = {
  id: string
  label: string
}

type LinkParentMarriageSelectProps = {
  marriages: MarriageOption[]
}

export function LinkParentMarriageSelect({ marriages }: LinkParentMarriageSelectProps) {
  const [marriageId, setMarriageId] = useState("")

  return (
    <FormSelectField
      id="marriageId"
      name="marriageId"
      onValueChange={setMarriageId}
      options={marriages.map((marriage) => ({
        value: marriage.id,
        label: marriage.label,
      }))}
      placeholder="Pilih pernikahan"
      required
      value={marriageId}
    />
  )
}
