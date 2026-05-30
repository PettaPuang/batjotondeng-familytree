"use client"

import { useState } from "react"
import type { Gender, Person } from "@prisma/client"

import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DatePickerField } from "@/components/silsilah/date-picker-field"
import { FormSelectField } from "@/components/silsilah/form-select-field"
import { PersonPhotoField } from "@/components/silsilah/person-photo-field"
import { deceasedCheckboxLabel } from "@/lib/silsilah/person-display"

const detailInputClassName =
  "bg-input/50 h-8 w-full rounded-2xl border border-transparent px-2.5 text-sm md:text-sm"

type PersonFormFieldsProps = {
  person?: Person
  layout?: "default" | "detail"
  idPrefix?: string
}

function FormRow({
  label,
  layout,
  children,
}: {
  label: string
  layout: "default" | "detail"
  children: React.ReactNode
}) {
  if (layout === "detail") {
    return (
      <div className="grid grid-cols-3 items-start gap-4">
        <span className="text-muted-foreground col-span-1 pt-2 text-sm">{label}</span>
        <div className="col-span-2">{children}</div>
      </div>
    )
  }

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </Field>
  )
}

function DeceasedCheckbox({
  checked,
  id,
  label,
  layout,
  onCheckedChange,
}: {
  checked: boolean
  id: string
  label: string
  layout: "default" | "detail"
  onCheckedChange: (checked: boolean) => void
}) {
  const checkbox = (
    <label className="flex items-center gap-2 text-sm">
      <input
        checked={checked}
        className="size-4"
        id={id}
        name="isDeceased"
        onChange={(event) => onCheckedChange(event.target.checked)}
        type="checkbox"
      />
      {label}
    </label>
  )

  if (layout === "detail") {
    return <FormRow label="Status" layout={layout}>{checkbox}</FormRow>
  }

  return (
    <Field orientation="horizontal">
      {checkbox}
    </Field>
  )
}

export function PersonFormFields({
  person,
  layout = "default",
  idPrefix = "",
}: PersonFormFieldsProps) {
  const id = (name: string) => `${idPrefix}${name}`
  const inputClassName = layout === "detail" ? detailInputClassName : undefined
  const [gender, setGender] = useState<Gender | "">(person?.gender ?? "")
  const [fullName, setFullName] = useState(person?.fullName ?? "")
  const [isDeceased, setIsDeceased] = useState(person ? !person.isAlive : false)
  const deceasedLabel = deceasedCheckboxLabel(gender)

  const content = (
    <>
      <FormRow label="Nama lengkap" layout={layout}>
        <Input
          className={inputClassName}
          defaultValue={person?.fullName ?? ""}
          id={id("fullName")}
          name="fullName"
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Contoh: Armanda Yusram Teruna"
          required
        />
      </FormRow>

      <PersonPhotoField
        defaultPhotoUrl={person?.photoUrl}
        gender={gender}
        idPrefix={idPrefix}
        layout={layout}
        name={fullName}
      />

      <FormRow label="Nama panggilan" layout={layout}>
        <Input
          className={inputClassName}
          defaultValue={person?.nickname ?? ""}
          id={id("nickname")}
          name="nickname"
          placeholder="Opsional"
        />
      </FormRow>

      <FormRow label="Jenis kelamin" layout={layout}>
        <FormSelectField
          id={id("gender")}
          name="gender"
          onValueChange={(value) => setGender(value as Gender)}
          options={[
            { value: "MALE", label: "Laki-laki" },
            { value: "FEMALE", label: "Perempuan" },
          ]}
          placeholder="Pilih jenis kelamin"
          required
          triggerClassName={inputClassName}
          value={gender}
        />
      </FormRow>

      {layout === "default" ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={id("birthDate")}>Tanggal lahir</FieldLabel>
            <DatePickerField
              defaultValue={person?.birthDate ?? null}
              id={id("birthDate")}
              name="birthDate"
              placeholder="Pilih tanggal lahir"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor={id("birthPlace")}>Tempat lahir</FieldLabel>
            <Input
              defaultValue={person?.birthPlace ?? ""}
              id={id("birthPlace")}
              name="birthPlace"
              placeholder="Contoh: Sungguminasa"
            />
          </Field>
        </div>
      ) : (
        <>
          <FormRow label="Tanggal lahir" layout={layout}>
            <DatePickerField
              defaultValue={person?.birthDate ?? null}
              id={id("birthDate")}
              name="birthDate"
              placeholder="Pilih tanggal lahir"
            />
          </FormRow>

          <FormRow label="Tempat lahir" layout={layout}>
            <Input
              className={inputClassName}
              defaultValue={person?.birthPlace ?? ""}
              id={id("birthPlace")}
              name="birthPlace"
              placeholder="Contoh: Sungguminasa"
            />
          </FormRow>
        </>
      )}

      <DeceasedCheckbox
        checked={isDeceased}
        id={id("isDeceased")}
        label={deceasedLabel}
        layout={layout}
        onCheckedChange={setIsDeceased}
      />

      {isDeceased ? (
        <FormRow label="Tanggal meninggal" layout={layout}>
          <DatePickerField
            defaultValue={person?.deathDate ?? null}
            id={id("deathDate")}
            name="deathDate"
            placeholder="Pilih tanggal meninggal"
          />
        </FormRow>
      ) : null}

      {layout === "default" ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={id("phone")}>Telepon</FieldLabel>
            <Input
              defaultValue={person?.phone ?? ""}
              id={id("phone")}
              name="phone"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor={id("address")}>Alamat</FieldLabel>
            <Input
              defaultValue={person?.address ?? ""}
              id={id("address")}
              name="address"
            />
          </Field>
        </div>
      ) : (
        <>
          <FormRow label="Telepon" layout={layout}>
            <Input
              className={inputClassName}
              defaultValue={person?.phone ?? ""}
              id={id("phone")}
              name="phone"
            />
          </FormRow>

          <FormRow label="Alamat" layout={layout}>
            <Input
              className={inputClassName}
              defaultValue={person?.address ?? ""}
              id={id("address")}
              name="address"
            />
          </FormRow>
        </>
      )}

      <FormRow label="Catatan" layout={layout}>
        <Textarea
          className={layout === "detail" ? "bg-input/50 min-h-24 rounded-2xl border-transparent" : undefined}
          defaultValue={person?.notes ?? ""}
          id={id("notes")}
          name="notes"
          rows={4}
        />
      </FormRow>
    </>
  )

  if (layout === "detail") {
    return <div className="flex flex-col gap-4">{content}</div>
  }

  return <FieldGroup>{content}</FieldGroup>
}
