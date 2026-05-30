"use client"

import { useActionState, useEffect, useRef } from "react"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"
import type { Person } from "@prisma/client"

import { PersonMarriageDateField } from "@/components/silsilah/person-marriage-date-field"
import type { PersonWithRelations } from "@/lib/silsilah/types"

import {
  createPersonSheetAction,
  updatePersonSheetAction,
} from "@/app/silsilah/actions"
import type { PersonSheetState } from "@/app/silsilah/actions"
import { CreatePersonRelationFields } from "@/components/silsilah/create-person-relation-fields"
import { PersonFormFields } from "@/components/silsilah/person-form-fields"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { CreatePersonRelationOption } from "@/lib/auth/create-person-options"
import { toastMessages } from "@/lib/toast-messages"

const initialState: PersonSheetState = {
  ok: false,
  personId: null,
  error: null,
  submittedAt: null,
}

type PersonFormSheetMode = "create" | "edit"

type PersonFormSheetProps = {
  mode: PersonFormSheetMode
  open: boolean
  onOpenChange: (open: boolean) => void
  person?: Person | PersonWithRelations | null
  onSuccess?: (personId: string) => void
  createOptions?: CreatePersonRelationOption
}

function normalizePersonDates(person: Person): Person {
  return {
    ...person,
    birthDate: person.birthDate ? new Date(person.birthDate) : null,
    deathDate: person.deathDate ? new Date(person.deathDate) : null,
    createdAt: new Date(person.createdAt),
    updatedAt: new Date(person.updatedAt),
  }
}

function isPersonWithRelations(
  person: Person | PersonWithRelations,
): person is PersonWithRelations {
  return "marriages" in person && "marriages2" in person
}

export function PersonFormSheet({
  mode,
  open,
  onOpenChange,
  person,
  onSuccess,
  createOptions,
}: PersonFormSheetProps) {
  const isEdit = mode === "edit"
  const formId = isEdit ? "person-edit-form" : "person-add-form"
  const idPrefix = isEdit ? "edit-" : "add-"
  const action = isEdit ? updatePersonSheetAction : createPersonSheetAction
  const normalizedPerson = person ? normalizePersonDates(person) : undefined
  const formResetKey = open
    ? `${mode}-${normalizedPerson?.id ?? "new"}`
    : "closed"

  const handledSubmissionRef = useRef<number | null>(null)
  const [state, formAction, pending] = useActionState(action, initialState)

  useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }
  }, [state.error])

  useEffect(() => {
    if (
      !state.ok ||
      !state.personId ||
      !state.submittedAt ||
      handledSubmissionRef.current === state.submittedAt
    ) {
      return
    }

    handledSubmissionRef.current = state.submittedAt
    toast.success(isEdit ? toastMessages.personUpdated : toastMessages.personCreated)
    onSuccess?.(state.personId)
    onOpenChange(false)
  }, [state, isEdit, onOpenChange, onSuccess])

  const canSubmit = !isEdit || !!normalizedPerson

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Data" : "Tambah Anggota"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Perbarui data pribadi anggota keluarga."
              : "Isi data dan pilih hubungan keluarga dengan Anda."}
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          <form
            action={formAction}
            className="flex flex-col gap-4"
            id={formId}
            key={formResetKey}
          >
            {isEdit && normalizedPerson ? (
              <input name="personId" type="hidden" value={normalizedPerson.id} />
            ) : null}
            {!isEdit && createOptions ? (
              <CreatePersonRelationFields
                createOptions={createOptions}
                idPrefix={idPrefix}
              />
            ) : null}
            {isEdit && normalizedPerson && isPersonWithRelations(normalizedPerson) ? (
              <PersonMarriageDateField
                idPrefix={idPrefix}
                person={normalizedPerson}
              />
            ) : null}
            <PersonFormFields
              idPrefix={idPrefix}
              layout="detail"
              person={normalizedPerson}
            />
            {state.error ? (
              <p className="text-destructive text-sm" role="alert">
                {state.error}
              </p>
            ) : null}
          </form>
        </SheetBody>

        <SheetFooter className="justify-end">
          <SheetClose asChild>
            <Button disabled={pending} type="button" variant="outline">
              Batal
            </Button>
          </SheetClose>
          <Button disabled={pending || !canSubmit} form={formId} type="submit">
            {pending ? (
              <>
                <Loader2Icon className="animate-spin" />
                Menyimpan...
              </>
            ) : isEdit ? (
              "Simpan Perubahan"
            ) : (
              "Simpan Anggota"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export function PersonAddSheet(
  props: Omit<PersonFormSheetProps, "mode" | "person"> & {
    createOptions: CreatePersonRelationOption
  },
) {
  return <PersonFormSheet mode="create" {...props} />
}
