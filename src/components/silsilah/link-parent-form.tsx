"use client"

import { linkParentAction } from "@/app/silsilah/actions"
import { ActionToastForm } from "@/components/action-toast-form"
import { LinkParentMarriageSelect } from "@/components/silsilah/link-parent-marriage-select"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { toastMessages } from "@/lib/toast-messages"

type LinkParentFormProps = {
  childId: string
  marriages: { id: string; label: string }[]
}

export function LinkParentForm({ childId, marriages }: LinkParentFormProps) {
  return (
    <ActionToastForm
      action={linkParentAction}
      className="max-w-2xl"
      successMessage={toastMessages.parentLinked}
    >
      <input name="childId" type="hidden" value={childId} />

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="marriageId">Pernikahan orang tua</FieldLabel>
          <LinkParentMarriageSelect marriages={marriages} />
          <FieldDescription>
            Jika pernikahan belum ada, buat dulu di menu Pernikahan (Anda harus
            terlibat sebagai suami atau istri).
          </FieldDescription>
        </Field>

        <button
          className="bg-primary text-primary-foreground h-9 w-fit rounded-md px-4 text-sm font-medium"
          type="submit"
        >
          Simpan Relasi
        </button>
      </FieldGroup>
    </ActionToastForm>
  )
}
