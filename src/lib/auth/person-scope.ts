import { cache } from "react"

import { ManageForbiddenError } from "@/lib/auth/errors"
import { parseDateInput } from "@/lib/silsilah/format"
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

export async function assertActorInMarriage(
  actorPersonId: string,
  marriageId: string,
): Promise<void> {
  const marriage = await prisma.marriage.findUnique({
    where: { id: marriageId },
    select: { husbandId: true, wifeId: true },
  })

  if (!marriage) {
    throw new Error("Pernikahan tidak ditemukan.")
  }

  if (
    marriage.husbandId !== actorPersonId &&
    marriage.wifeId !== actorPersonId
  ) {
    throw new ManageForbiddenError(
      "Anda hanya dapat mengelola pernikahan yang melibatkan Anda sebagai suami atau istri.",
    )
  }
}

export async function assertCanLinkParent(
  actorPersonId: string,
  childId: string,
  marriageId: string,
): Promise<void> {
  await assertCanManagePerson(actorPersonId, childId)

  const marriage = await prisma.marriage.findUnique({
    where: { id: marriageId },
    select: { husbandId: true, wifeId: true },
  })

  if (!marriage) {
    throw new Error("Pernikahan tidak ditemukan.")
  }

  if (childId === actorPersonId) {
    await assertCanManagePerson(actorPersonId, marriage.husbandId)
    await assertCanManagePerson(actorPersonId, marriage.wifeId)
    return
  }

  const isActorParent =
    marriage.husbandId === actorPersonId ||
    marriage.wifeId === actorPersonId

  if (!isActorParent) {
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
    await assertActorInMarriage(actorPersonId, relation.marriageId)
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
): Promise<void> {
  if (relation.kind === "child") {
    await prisma.personParent.upsert({
      where: {
        childId_marriageId: {
          childId: newPersonId,
          marriageId: relation.marriageId,
        },
      },
      update: {},
      create: {
        childId: newPersonId,
        marriageId: relation.marriageId,
      },
    })
    return
  }

  if (relation.kind === "sibling") {
    await prisma.personParent.upsert({
      where: {
        childId_marriageId: {
          childId: newPersonId,
          marriageId: relation.parentMarriageId,
        },
      },
      update: {},
      create: {
        childId: newPersonId,
        marriageId: relation.parentMarriageId,
      },
    })
    return
  }

  if (relation.kind === "spouse") {
    const actor = await prisma.person.findUnique({
      where: { id: actorPersonId },
      select: { gender: true },
    })

    if (!actor) {
      throw new Error("Data Anda tidak ditemukan.")
    }

    const newPerson = await prisma.person.findUnique({
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

    await prisma.marriage.create({
      data: {
        husbandId,
        wifeId,
        marriageDate: relation.marriageDate,
        isActive: true,
      },
    })
  }
}

export async function updateMarriageDateFromForm(
  actorPersonId: string,
  formData: FormData,
): Promise<void> {
  const marriageId = String(formData.get("marriageId") ?? "").trim()

  if (!marriageId) {
    return
  }

  await assertActorInMarriage(actorPersonId, marriageId)

  const marriageDate = parseDateInput(String(formData.get("marriageDate") ?? ""))

  await prisma.marriage.update({
    where: { id: marriageId },
    data: { marriageDate },
  })
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
}
