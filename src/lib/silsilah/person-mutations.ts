import { deleteStoredPersonPhoto } from "@/lib/blob/person-photo"
import {
  applyCreatePersonRelation,
  assertCanManageMarriage,
  assertCanManagePerson,
  parseCreatePersonRelation,
  type CreatePersonRelation,
} from "@/lib/auth/person-scope"
import { parseDateInput } from "@/lib/silsilah/format"
import { logPersonCreated, logPersonDeleted, logPersonUpdated } from "@/lib/silsilah/person-audit"
import { readPersonFormData } from "@/lib/silsilah/person-form-server"
import { prisma } from "@/lib/prisma"

export type MutationActor = {
  personId: string
  name?: string | null
}

async function cleanupReplacedPersonPhoto(
  beforePhotoUrl: string | null | undefined,
  afterPhotoUrl: string | null | undefined,
) {
  if (beforePhotoUrl && beforePhotoUrl !== afterPhotoUrl) {
    await deleteStoredPersonPhoto(beforePhotoUrl)
  }
}

export async function createPersonFromForm(
  actor: MutationActor,
  formData: FormData,
  relation: CreatePersonRelation,
) {
  const data = readPersonFormData(formData)

  return prisma.$transaction(async (tx) => {
    const person = await tx.person.create({ data })

    await applyCreatePersonRelation(actor.personId, person.id, relation, tx)

    await logPersonCreated(
      person,
      {
        personId: actor.personId,
        name: actor.name,
      },
      tx,
    )

    return person
  })
}

export async function updatePersonFromForm(
  actor: MutationActor,
  personId: string,
  formData: FormData,
  options?: { includeMarriageDate?: boolean },
) {
  await assertCanManagePerson(actor.personId, personId)

  const before = await prisma.person.findUnique({ where: { id: personId } })

  if (!before) {
    throw new Error("Anggota tidak ditemukan.")
  }

  const data = readPersonFormData(formData)

  const marriageId = options?.includeMarriageDate
    ? String(formData.get("marriageId") ?? "").trim()
    : ""

  if (marriageId) {
    await assertCanManageMarriage(actor.personId, marriageId)
  }

  const after = await prisma.$transaction(async (tx) => {
    const person = await tx.person.update({
      where: { id: personId },
      data,
    })

    if (marriageId) {
      await tx.marriage.update({
        where: { id: marriageId },
        data: {
          marriageDate: parseDateInput(String(formData.get("marriageDate") ?? "")),
        },
      })
    }

    await logPersonUpdated(
      before,
      person,
      {
        personId: actor.personId,
        name: actor.name,
      },
      tx,
    )

    return person
  })

  await cleanupReplacedPersonPhoto(before.photoUrl, after.photoUrl)

  return after
}

export async function deletePersonById(actor: MutationActor, personId: string) {
  await assertCanManagePerson(actor.personId, personId)

  const person = await prisma.person.findUnique({ where: { id: personId } })

  if (!person) {
    throw new Error("Anggota tidak ditemukan.")
  }

  await prisma.$transaction(async (tx) => {
    await logPersonDeleted(
      person,
      {
        personId: actor.personId,
        name: actor.name,
      },
      tx,
    )

    await tx.person.delete({ where: { id: personId } })
  })

  await deleteStoredPersonPhoto(person.photoUrl)

  return person
}

export function jsonBodyToFormData(body: Record<string, unknown>) {
  const formData = new FormData()

  for (const [key, value] of Object.entries(body)) {
    if (value !== null && value !== undefined) {
      formData.set(key, String(value))
    }
  }

  return formData
}

export { parseCreatePersonRelation }
