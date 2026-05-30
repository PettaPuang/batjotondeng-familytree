import { deleteStoredPersonPhoto } from "@/lib/blob/person-photo"
import {
  applyCreatePersonRelation,
  assertCanManagePerson,
  parseCreatePersonRelation,
  updateMarriageDateFromForm,
  type CreatePersonRelation,
} from "@/lib/auth/person-scope"
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
  const person = await prisma.person.create({ data })

  await applyCreatePersonRelation(actor.personId, person.id, relation)

  await logPersonCreated(person, {
    personId: actor.personId,
    name: actor.name,
  })

  return person
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
  const after = await prisma.person.update({
    where: { id: personId },
    data,
  })

  if (options?.includeMarriageDate) {
    await updateMarriageDateFromForm(actor.personId, formData)
  }

  await logPersonUpdated(before, after, {
    personId: actor.personId,
    name: actor.name,
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

  await logPersonDeleted(person, {
    personId: actor.personId,
    name: actor.name,
  })

  await deleteStoredPersonPhoto(person.photoUrl)

  await prisma.person.delete({ where: { id: personId } })

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
