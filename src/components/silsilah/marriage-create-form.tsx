"use client"

import { createMarriageAction } from "@/app/silsilah/actions"
import { ActionToastForm } from "@/components/action-toast-form"
import { DatePickerField } from "@/components/silsilah/date-picker-field"
import { MarriageCreateFields } from "@/components/silsilah/marriage-create-fields"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { toastMessages } from "@/lib/toast-messages"

type MarriageCreateFormProps = {
  husbands: { id: string; fullName: string }[]
  wives: { id: string; fullName: string }[]
}

export function MarriageCreateForm({ husbands, wives }: MarriageCreateFormProps) {
  return (
    <ActionToastForm
      action={createMarriageAction}
      className="max-w-2xl"
      successMessage={toastMessages.marriageCreated}
    >
      <FieldGroup>
        <MarriageCreateFields husbands={husbands} wives={wives} />

        <Field>
          <FieldLabel htmlFor="marriageDate">Tanggal pernikahan</FieldLabel>
          <DatePickerField
            id="marriageDate"
            name="marriageDate"
            placeholder="Pilih tanggal pernikahan"
          />
        </Field>

        <button
          className="bg-primary text-primary-foreground h-9 w-fit rounded-md px-4 text-sm font-medium"
          type="submit"
        >
          Simpan Pernikahan
        </button>
      </FieldGroup>
    </ActionToastForm>
  )
}
