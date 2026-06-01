import "server-only"

import { Prisma, type Gender } from "@prisma/client"

import { deleteStoredPersonPhoto, isVercelBlobUrl } from "@/lib/blob/person-photo"
import {
  applyCreatePersonRelation,
  assertFamilyScope,
  parseCreatePersonRelation,
  type CreatePersonRelation,
} from "@/lib/auth/person-scope"
import { parseDateInput } from "@/lib/silsilah/format"
import { logPersonCreated, logPersonDeleted, logPersonUpdated } from "@/lib/silsilah/person-audit.server"
import { prisma } from "@/lib/prisma"

export function prismaErrorMessage(error: unknown): string | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return null
  }

  switch (error.code) {
    case "P2002":
      return "Data ini sudah ada (duplikat)."
    case "P2003":
      return "Data tidak dapat diubah/dihapus karena masih terhubung dengan data lain."
    default:
      return null
  }
}

export async function upsertPersonParentLink(
  childId: string,
  marriageId: string,
  db: Prisma.TransactionClient | typeof prisma = prisma,
) {
  return db.personParent.upsert({
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
}

export type MutationActor = {
  personId: string
  name?: string | null
}

function readPersonFormData(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim()
  const nickname = String(formData.get("nickname") ?? "").trim()
  const gender = String(formData.get("gender") ?? "") as Gender
  const birthPlace = String(formData.get("birthPlace") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim()
  const address = String(formData.get("address") ?? "").trim()
  const notes = String(formData.get("notes") ?? "").trim()
  const isDeceased = formData.get("isDeceased") === "on"
  const isAlive = !isDeceased
  const birthDate = parseDateInput(String(formData.get("birthDate") ?? ""))
  const deathDate = parseDateInput(String(formData.get("deathDate") ?? ""))
  const photoUrl = String(formData.get("photoUrl") ?? "").trim()

  if (!fullName || (gender !== "MALE" && gender !== "FEMALE")) {
    throw new Error("Nama lengkap dan jenis kelamin wajib diisi.")
  }

  return {
    fullName,
    nickname: nickname || null,
    gender,
    birthDate,
    birthPlace: birthPlace || null,
    phone: phone || null,
    address: address || null,
    notes: notes || null,
    photoUrl: photoUrl && isVercelBlobUrl(photoUrl) ? photoUrl : null,
    isAlive,
    deathDate: isAlive ? null : deathDate,
  }
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
  await assertFamilyScope(actor.personId, personId)

  const before = await prisma.person.findUnique({ where: { id: personId } })

  if (!before) {
    throw new Error("Anggota tidak ditemukan.")
  }

  const data = readPersonFormData(formData)

  const marriageId = options?.includeMarriageDate
    ? String(formData.get("marriageId") ?? "").trim()
    : ""

  if (marriageId) {
    const marriage = await prisma.marriage.findUnique({
      where: { id: marriageId },
      select: { husbandId: true, wifeId: true },
    })
    if (marriage) {
      await assertFamilyScope(actor.personId, marriage.husbandId)
      await assertFamilyScope(actor.personId, marriage.wifeId)
    }
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
  await assertFamilyScope(actor.personId, personId)

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

export { parseCreatePersonRelation }
