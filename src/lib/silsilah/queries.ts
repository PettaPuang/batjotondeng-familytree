import { cache } from "react"

import { prisma } from "@/lib/prisma"
import { getChildrenFromPerson, getRootPersons } from "@/lib/silsilah/person-utils"
import { getSilsilahTreePayload } from "@/lib/silsilah/tree-payload"
import { hydrateTreePersons } from "@/lib/silsilah/tree-graph"
import type { PersonWithRelations, TreePerson } from "@/lib/silsilah/types"

export type { PersonWithRelations, TreePerson }
export { getChildrenFromPerson, getRootPersons }
export { getSilsilahTreePayload, hydrateTreePersons }
export type { SilsilahTreePayload } from "@/lib/silsilah/tree-graph"

const personInclude = {
  marriages: {
    include: {
      wife: true,
      children: {
        include: {
          child: true,
        },
      },
    },
  },
  marriages2: {
    include: {
      husband: true,
      children: {
        include: {
          child: true,
        },
      },
    },
  },
  parents: {
    include: {
      marriage: {
        include: {
          husband: true,
          wife: true,
        },
      },
    },
  },
} as const

export const getPersonById = cache(async (id: string) => {
  return prisma.person.findUnique({
    where: { id },
    include: personInclude,
  })
})

export async function getPersonSelectOptions() {
  return prisma.person.findMany({
    select: {
      id: true,
      fullName: true,
      gender: true,
    },
    orderBy: { fullName: "asc" },
  })
}

export async function getMarriageSelectOptions() {
  return prisma.marriage.findMany({
    include: {
      husband: { select: { id: true, fullName: true } },
      wife: { select: { id: true, fullName: true } },
    },
    orderBy: { marriageDate: "desc" },
  })
}

export async function getTreePersons() {
  const payload = await getSilsilahTreePayload()
  return hydrateTreePersons(payload)
}

export async function getPersonAuditLogs(personId: string) {
  return prisma.personAuditLog.findMany({
    where: { personId },
    orderBy: { createdAt: "desc" },
  })
}

export async function getPersonDetailForViewer(
  actorPersonId: string,
  targetPersonId: string,
) {
  const [person, viewer] = await Promise.all([
    getPersonById(targetPersonId),
    getPersonById(actorPersonId),
  ])

  if (!person) {
    return null
  }

  const { buildPersonViewerContext } = await import(
    "@/lib/silsilah/person-relation-context"
  )

  const viewerContext = viewer
    ? buildPersonViewerContext(viewer, person)
    : null

  return { person, viewerContext }
}
