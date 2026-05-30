"use client"

import { createMarriageAction } from "@/app/silsilah/actions"
import { ActionToastForm } from "@/components/action-toast-form"
import { DatePickerField } from "@/components/silsilah/date-picker-field"
import { FormSubmitButton } from "@/components/silsilah/form-submit-button"
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

        <FormSubmitButton>Simpan Pernikahan</FormSubmitButton>
      </FieldGroup>
    </ActionToastForm>
  )
}
