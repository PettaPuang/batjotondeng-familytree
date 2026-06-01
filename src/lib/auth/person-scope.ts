import type { Prisma } from "@prisma/client"
import { cache } from "react"

export const MANAGE_FORBIDDEN_MESSAGE =
  "Anda tidak memiliki izin untuk mengubah data anggota ini."

export class ManageForbiddenError extends Error {
  constructor(message = MANAGE_FORBIDDEN_MESSAGE) {
    super(message)
    this.name = "ManageForbiddenError"
  }
}
import { parseDateInput } from "@/lib/silsilah/format"
import { upsertPersonParentLink } from "@/lib/silsilah/person-mutations"
import { prisma } from "@/lib/prisma"

type ActorGraph = {
  id: string
  parents: { marriageId: string; marriage: { husbandId: string; wifeId: string } }[]
  marriages: {
    id: string
    husbandId: string
    wifeId: string
    children: {
      childId: string
      child: {
        id: string
        marriages: { wifeId: string }[]
        marriages2: { husbandId: string }[]
      }
    }[]
  }[]
  marriages2: {
    id: string
    husbandId: string
    wifeId: string
    children: {
      childId: string
      child: {
        id: string
        marriages: { wifeId: string }[]
        marriages2: { husbandId: string }[]
      }
    }[]
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
      children: {
        select: {
          childId: true,
          child: {
            select: {
              id: true,
              marriages: { select: { wifeId: true } },
              marriages2: { select: { husbandId: true } },
            },
          },
        },
      },
    },
  },
  marriages2: {
    select: {
      id: true,
      husbandId: true,
      wifeId: true,
      children: {
        select: {
          childId: true,
          child: {
            select: {
              id: true,
              marriages: { select: { wifeId: true } },
              marriages2: { select: { husbandId: true } },
            },
          },
        },
      },
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

      for (const m of child.child.marriages) {
        ids.add(m.wifeId)
      }
      for (const m of child.child.marriages2) {
        ids.add(m.husbandId)
      }
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

export async function isFamilyScope(
  actorPersonId: string,
  targetPersonId: string,
): Promise<boolean> {
  if (actorPersonId === targetPersonId) {
    return true
  }

  const manageable = await getManageablePersonIds(actorPersonId)
  return manageable.has(targetPersonId)
}

export async function assertFamilyScope(
  actorPersonId: string,
  targetPersonId: string,
): Promise<void> {
  const allowed = await isFamilyScope(actorPersonId, targetPersonId)

  if (!allowed) {
    throw new ManageForbiddenError()
  }
}

async function canLinkParentForChild(
  actorPersonId: string,
  childId: string,
): Promise<boolean> {
  if (!(await isFamilyScope(actorPersonId, childId))) {
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
    await assertFamilyScope(actorPersonId, marriage.husbandId)
    await assertFamilyScope(actorPersonId, marriage.wifeId)
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
