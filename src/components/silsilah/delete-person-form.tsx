"use client"

import { DeletePersonButton } from "@/components/silsilah/delete-person-button"

type DeletePersonFormProps = {
  personId: string
  personName: string
  action: (formData: FormData) => Promise<void>
}

export function DeletePersonForm({
  personId,
  personName,
  action,
}: DeletePersonFormProps) {
  return (
    <DeletePersonButton
      action={action}
      personId={personId}
      personName={personName}
    />
  )
}
