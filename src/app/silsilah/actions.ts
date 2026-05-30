"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { ManageForbiddenError } from "@/lib/auth/errors"
import {
  assertCanCreateMarriage,
  assertCanCreatePersonWithRelation,
  assertCanLinkParent,
  parseCreatePersonRelation,
} from "@/lib/auth/person-scope"
import { requireActor } from "@/lib/auth/session-actor"
import { parseDateInput } from "@/lib/silsilah/format"
import {
  createPersonFromForm,
  deletePersonById,
  updatePersonFromForm,
} from "@/lib/silsilah/person-mutations"
import { prisma } from "@/lib/prisma"

function revalidateSilsilah() {
  revalidatePath("/silsilah")
  revalidatePath("/silsilah/pohon")
}

function formatActionError(error: unknown) {
  if (error instanceof ManageForbiddenError) {
    return error.message
  }

  return error instanceof Error ? error.message : "Terjadi kesalahan."
}

export type PersonSheetState = {
  ok: boolean
  personId: string | null
  error: string | null
  submittedAt: number | null
}

export type CreatePersonSheetState = PersonSheetState

export async function createPersonSheetAction(
  _prevState: PersonSheetState,
  formData: FormData,
): Promise<PersonSheetState> {
  try {
    const actor = await requireActor()
    const relation = parseCreatePersonRelation(formData)
    await assertCanCreatePersonWithRelation(actor.personId, relation)

    const person = await createPersonFromForm(actor, formData, relation)

    revalidateSilsilah()

    return {
      ok: true,
      personId: person.id,
      error: null,
      submittedAt: Date.now(),
    }
  } catch (error) {
    return {
      ok: false,
      personId: null,
      error: formatActionError(error),
      submittedAt: null,
    }
  }
}

export async function updatePersonSheetAction(
  _prevState: PersonSheetState,
  formData: FormData,
): Promise<PersonSheetState> {
  try {
    const actor = await requireActor()
    const id = String(formData.get("personId") ?? "")

    if (!id) {
      throw new Error("Anggota tidak ditemukan.")
    }

    const after = await updatePersonFromForm(actor, id, formData, {
      includeMarriageDate: true,
    })

    revalidateSilsilah()
    revalidatePath(`/silsilah/${id}`)

    return {
      ok: true,
      personId: after.id,
      error: null,
      submittedAt: Date.now(),
    }
  } catch (error) {
    return {
      ok: false,
      personId: null,
      error: formatActionError(error),
      submittedAt: null,
    }
  }
}

export async function updatePersonAction(id: string, formData: FormData) {
  const actor = await requireActor()
  await updatePersonFromForm(actor, id, formData)
  revalidateSilsilah()
  revalidatePath(`/silsilah/${id}`)
  redirect("/silsilah")
}

export async function deletePersonAction(id: string) {
  const actor = await requireActor()
  await deletePersonById(actor, id)
  revalidateSilsilah()
  redirect("/silsilah")
}

export async function createMarriageAction(formData: FormData) {
  const actor = await requireActor()

  const husbandId = String(formData.get("husbandId") ?? "")
  const wifeId = String(formData.get("wifeId") ?? "")
  const marriageDate = parseDateInput(String(formData.get("marriageDate") ?? ""))

  if (!husbandId || !wifeId) {
    throw new Error("Suami dan istri wajib dipilih.")
  }

  await assertCanCreateMarriage(actor.personId, husbandId, wifeId)

  await prisma.marriage.create({
    data: {
      husbandId,
      wifeId,
      marriageDate,
      isActive: true,
    },
  })

  revalidateSilsilah()
  redirect("/silsilah/pernikahan")
}

export async function linkParentAction(formData: FormData) {
  const actor = await requireActor()

  const childId = String(formData.get("childId") ?? "")
  const marriageId = String(formData.get("marriageId") ?? "")

  if (!childId || !marriageId) {
    throw new Error("Anak dan pernikahan orang tua wajib dipilih.")
  }

  await assertCanLinkParent(actor.personId, childId, marriageId)

  await prisma.personParent.upsert({
    where: {
      childId_marriageId: {
        childId,
        marriageId,
      },
    },
    update: {},
    create: {
      childId,
      marriageId,
    },
  })

  revalidateSilsilah()
  revalidatePath(`/silsilah/${childId}`)
  redirect("/silsilah")
}
