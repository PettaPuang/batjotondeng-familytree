"use client"

import { useState } from "react"

import { DatePickerField } from "@/components/silsilah/date-picker-field"
import { FormSelectField } from "@/components/silsilah/form-select-field"
import { Field, FieldLabel } from "@/components/ui/field"
import type { CreatePersonRelationOption } from "@/lib/auth/create-person-options"

type RelationKind = "child" | "sibling" | "spouse"

type CreatePersonRelationFieldsProps = {
  createOptions: CreatePersonRelationOption
  idPrefix?: string
}

export function CreatePersonRelationFields({
  createOptions,
  idPrefix = "add-",
}: CreatePersonRelationFieldsProps) {
  const canChild = createOptions.marriages.length > 0
  const canSibling = createOptions.parentMarriages.length > 0
  const defaultKind: RelationKind = canChild
    ? "child"
    : canSibling
      ? "sibling"
      : "spouse"

  const [kind, setKind] = useState<RelationKind>(defaultKind)
  const [marriageId, setMarriageId] = useState("")
  const [parentMarriageId, setParentMarriageId] = useState(
    createOptions.parentMarriages[0]?.id ?? "",
  )

  const relationOptions = [
    { value: "child", label: "Anak saya", disabled: !canChild },
    { value: "sibling", label: "Saudara kandung", disabled: !canSibling },
    { value: "spouse", label: "Pasangan (istri/suami)" },
  ]

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-dashed p-4">
      <Field>
        <FieldLabel htmlFor={`${idPrefix}relationKind`}>Hubungan keluarga</FieldLabel>
        <FormSelectField
          id={`${idPrefix}relationKind`}
          name="relationKind"
          onValueChange={(value) => setKind(value as RelationKind)}
          options={relationOptions}
          value={kind}
        />
      </Field>

      {kind === "child" ? (
        <Field>
          <FieldLabel htmlFor={`${idPrefix}marriageId`}>Pernikahan (orang tua anak)</FieldLabel>
          <FormSelectField
            id={`${idPrefix}marriageId`}
            name="marriageId"
            onValueChange={setMarriageId}
            options={createOptions.marriages.map((marriage) => ({
              value: marriage.id,
              label: marriage.label,
            }))}
            placeholder="Pilih pernikahan"
            required
            value={marriageId}
          />
        </Field>
      ) : null}

      {kind === "sibling" ? (
        <Field>
          <FieldLabel htmlFor={`${idPrefix}parentMarriageId`}>Pernikahan orang tua</FieldLabel>
          {createOptions.parentMarriages.length === 1 ? (
            <>
              <input
                name="parentMarriageId"
                type="hidden"
                value={createOptions.parentMarriages[0]?.id ?? ""}
              />
              <p className="text-muted-foreground text-sm">
                {createOptions.parentMarriages[0]?.label}
              </p>
            </>
          ) : (
            <FormSelectField
              id={`${idPrefix}parentMarriageId`}
              name="parentMarriageId"
              onValueChange={setParentMarriageId}
              options={createOptions.parentMarriages.map((marriage) => ({
                value: marriage.id,
                label: marriage.label,
              }))}
              placeholder="Pilih pernikahan orang tua"
              required
              value={parentMarriageId}
            />
          )}
        </Field>
      ) : null}

      {kind === "spouse" ? (
        <Field>
          <FieldLabel htmlFor={`${idPrefix}marriageDate`}>Tanggal pernikahan</FieldLabel>
          <DatePickerField
            id={`${idPrefix}marriageDate`}
            name="marriageDate"
            placeholder="Opsional"
          />
        </Field>
      ) : null}
    </div>
  )
}
