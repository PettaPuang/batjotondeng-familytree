"use client"

import { ActionToastForm } from "@/components/action-toast-form"
import { PersonFormFields } from "@/components/silsilah/person-form-fields"
import { toastMessages } from "@/lib/toast-messages"
import type { Person } from "@prisma/client"

type PersonFormProps = {
  person?: Person
  action: (formData: FormData) => Promise<void>
  submitLabel: string
}

export function PersonForm({ person, action, submitLabel }: PersonFormProps) {
  return (
    <ActionToastForm
      action={action}
      className="max-w-2xl"
      successMessage={toastMessages.personUpdated}
    >
      <PersonFormFields person={person} />

      <button
        className="bg-primary text-primary-foreground mt-6 h-9 w-fit rounded-md px-4 text-sm font-medium"
        type="submit"
      >
        {submitLabel}
      </button>
    </ActionToastForm>
  )
}
