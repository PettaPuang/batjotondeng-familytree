import type { Prisma } from "@prisma/client"
import { cache } from "react"

import { ManageForbiddenError } from "@/lib/auth/errors"
import { parseDateInput } from "@/lib/silsilah/format"
import { upsertPersonParentLink } from "@/lib/silsilah/person-parent"
import { prisma } from "@/lib/prisma"

type ActorGraph = {
  id: string
  parents: { marriageId: string; marriage: { husbandId: string; wifeId: string } }[]
  marriages: {
    id: string
    husbandId: string
    wifeId: string
    children: { childId: string }[]
  }[]
  marriages2: {
    id: string
    husbandId: string
    wifeId: string
    children: { childId: string }[]
  }[]
}

const actorGraphInclude = {
  parents: {
    select: {
      marriageId: true,
      marriage: {
        select: {
          husbandId: true,
          wifeId: true,
        },
      },
    },
  },
  marriages: {
    select: {
      id: true,
      husbandId: true,
      wifeId: true,
      children: { select: { childId: true } },
    },
  },
  marriages2: {
    select: {
      id: true,
      husbandId: true,
      wifeId: true,
      children: { select: { childId: true } },
    },
  },
} as const

function collectManageableIds(graph: ActorGraph): Set<string> {
  const ids = new Set<string>([graph.id])

  for (const link of graph.parents) {
    ids.add(link.marriage.husbandId)
    ids.add(link.marriage.wifeId)
  }

  for (const marriage of [...graph.marriages, ...graph.marriages2]) {
    ids.add(marriage.husbandId)
    ids.add(marriage.wifeId)

    for (const child of marriage.children) {
      ids.add(child.childId)
    }
  }

  return ids
}

async function loadActorGraph(actorPersonId: string): Promise<ActorGraph | null> {
  return prisma.person.findUnique({
    where: { id: actorPersonId },
    select: {
      id: true,
      ...actorGraphInclude,
    },
  })
}

export const getManageablePersonIds = cache(
  async (actorPersonId: string): Promise<Set<string>> => {
    const graph = await loadActorGraph(actorPersonId)

    if (!graph) {
      return new Set()
    }

    const ids = collectManageableIds(graph)

    if (graph.parents.length > 0) {
      const siblingLinks = await prisma.personParent.findMany({
        where: {
          marriageId: { in: graph.parents.map((link) => link.marriageId) },
          childId: { not: actorPersonId },
        },
        select: { childId: true },
      })

      for (const link of siblingLinks) {
        ids.add(link.childId)
      }
    }

    return ids
  },
)

async function getMarriageCouple(marriageId: string) {
  const marriage = await prisma.marriage.findUnique({
    where: { id: marriageId },
    select: { husbandId: true, wifeId: true },
  })

  if (!marriage) {
    throw new Error("Pernikahan tidak ditemukan.")
  }

  return marriage
}

function actorInMarriage(
  actorPersonId: string,
  marriage: { husbandId: string; wifeId: string },
) {
  return (
    marriage.husbandId === actorPersonId ||
    marriage.wifeId === actorPersonId
  )
}

export async function canManagePerson(
  actorPersonId: string,
  targetPersonId: string,
): Promise<boolean> {
  if (actorPersonId === targetPersonId) {
    return true
  }

  const manageable = await getManageablePersonIds(actorPersonId)
  return manageable.has(targetPersonId)
}

export async function assertCanManagePerson(
  actorPersonId: string,
  targetPersonId: string,
): Promise<void> {
  const allowed = await canManagePerson(actorPersonId, targetPersonId)

  if (!allowed) {
    throw new ManageForbiddenError()
  }
}

export async function assertCanManageMarriage(
  actorPersonId: string,
  marriageId: string,
): Promise<void> {
  const marriage = await getMarriageCouple(marriageId)

  const [canManageHusband, canManageWife] = await Promise.all([
    canManagePerson(actorPersonId, marriage.husbandId),
    canManagePerson(actorPersonId, marriage.wifeId),
  ])

  if (!canManageHusband || !canManageWife) {
    throw new ManageForbiddenError(
      "Anda tidak memiliki izin untuk mengubah data pernikahan ini.",
    )
  }
}

export async function canLinkParentForChild(
  actorPersonId: string,
  childId: string,
): Promise<boolean> {
  if (!(await canManagePerson(actorPersonId, childId))) {
    return false
  }

  if (childId === actorPersonId) {
    return true
  }

  const graph = await loadActorGraph(actorPersonId)

  return graph
    ? graph.marriages.length + graph.marriages2.length > 0
    : false
}

export async function assertCanLinkParent(
  actorPersonId: string,
  childId: string,
  marriageId: string,
): Promise<void> {
  if (!(await canLinkParentForChild(actorPersonId, childId))) {
    throw new ManageForbiddenError()
  }

  const marriage = await getMarriageCouple(marriageId)

  if (childId === marriage.husbandId || childId === marriage.wifeId) {
    throw new ManageForbiddenError(
      "Seseorang tidak bisa menjadi anak dari pernikahannya sendiri.",
    )
  }

  if (childId === actorPersonId) {
    await assertCanManagePerson(actorPersonId, marriage.husbandId)
    await assertCanManagePerson(actorPersonId, marriage.wifeId)
    return
  }

  if (!actorInMarriage(actorPersonId, marriage)) {
    throw new ManageForbiddenError(
      "Anda hanya dapat menghubungkan anak ke pernikahan yang melibatkan Anda sebagai orang tua.",
    )
  }
}

export type CreatePersonRelation =
  | { kind: "child"; marriageId: string }
  | { kind: "sibling"; parentMarriageId: string }
  | { kind: "spouse"; marriageDate: Date | null }

export function parseCreatePersonRelation(
  formData: FormData,
): CreatePersonRelation {
  const kind = String(formData.get("relationKind") ?? "")

  if (kind === "child") {
    const marriageId = String(formData.get("marriageId") ?? "").trim()

    if (!marriageId) {
      throw new Error("Pilih pernikahan untuk menambah anak.")
    }

    return { kind: "child", marriageId }
  }

  if (kind === "sibling") {
    const parentMarriageId = String(formData.get("parentMarriageId") ?? "").trim()

    if (!parentMarriageId) {
      throw new Error("Pernikahan orang tua tidak ditemukan untuk saudara.")
    }

    return { kind: "sibling", parentMarriageId }
  }

  if (kind === "spouse") {
    return {
      kind: "spouse",
      marriageDate: parseDateInput(String(formData.get("marriageDate") ?? "")),
    }
  }

  throw new Error(
    "Pilih jenis hubungan keluarga (anak, saudara kandung, atau pasangan).",
  )
}

export async function assertCanCreatePersonWithRelation(
  actorPersonId: string,
  relation: CreatePersonRelation,
): Promise<void> {
  if (relation.kind === "child") {
    const marriage = await getMarriageCouple(relation.marriageId)

    if (!actorInMarriage(actorPersonId, marriage)) {
      throw new ManageForbiddenError(
        "Anda hanya dapat menambah anak ke pernikahan yang melibatkan Anda.",
      )
    }

    return
  }

  if (relation.kind === "sibling") {
    const graph = await loadActorGraph(actorPersonId)

    if (
      !graph?.parents.some(
        (link) => link.marriageId === relation.parentMarriageId,
      )
    ) {
      throw new ManageForbiddenError(
        "Anda hanya dapat menambah saudara kandung lewat pernikahan orang tua Anda.",
      )
    }

    return
  }

  if (relation.kind === "spouse") {
    return
  }
}

export async function applyCreatePersonRelation(
  actorPersonId: string,
  newPersonId: string,
  relation: CreatePersonRelation,
  db: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<void> {
  if (relation.kind === "child") {
    await upsertPersonParentLink(newPersonId, relation.marriageId, db)
    return
  }

  if (relation.kind === "sibling") {
    await upsertPersonParentLink(newPersonId, relation.parentMarriageId, db)
    return
  }

  if (relation.kind === "spouse") {
    const actor = await db.person.findUnique({
      where: { id: actorPersonId },
      select: { gender: true },
    })

    if (!actor) {
      throw new Error("Data Anda tidak ditemukan.")
    }

    const newPerson = await db.person.findUnique({
      where: { id: newPersonId },
      select: { gender: true },
    })

    if (!newPerson) {
      throw new Error("Anggota baru tidak ditemukan.")
    }

    if (actor.gender === newPerson.gender) {
      throw new Error("Pasangan harus berjenis kelamin berbeda.")
    }

    const husbandId = actor.gender === "MALE" ? actorPersonId : newPersonId
    const wifeId = actor.gender === "FEMALE" ? actorPersonId : newPersonId

    await db.marriage.create({
      data: {
        husbandId,
        wifeId,
        marriageDate: relation.marriageDate,
        isActive: true,
      },
    })
  }
}

export async function assertCanCreateMarriage(
  actorPersonId: string,
  husbandId: string,
  wifeId: string,
): Promise<void> {
  if (husbandId === wifeId) {
    throw new Error("Suami dan istri tidak boleh orang yang sama.")
  }

  if (husbandId !== actorPersonId && wifeId !== actorPersonId) {
    throw new ManageForbiddenError(
      "Anda harus terlibat dalam pernikahan ini sebagai suami atau istri.",
    )
  }

  const [husband, wife] = await Promise.all([
    prisma.person.findUnique({
      where: { id: husbandId },
      select: { gender: true },
    }),
    prisma.person.findUnique({
      where: { id: wifeId },
      select: { gender: true },
    }),
  ])

  if (!husband || !wife) {
    throw new Error("Data suami atau istri tidak ditemukan.")
  }

  if (husband.gender !== "MALE" || wife.gender !== "FEMALE") {
    throw new Error("Suami harus laki-laki dan istri harus perempuan.")
  }
}
