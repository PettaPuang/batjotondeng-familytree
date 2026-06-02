import "server-only"

import { cache } from "react"

import { ManageForbiddenError } from "@/lib/auth/person-scope"
import { isFamilyScope } from "@/lib/auth/person-scope"
import { getDisplayAge } from "@/lib/silsilah/format"
import { prisma } from "@/lib/prisma"
import type {
  PersonDetailLimited,
  PersonWithRelations,
} from "@/lib/silsilah/types"

export type { PersonDetailLimited, PersonWithRelations } from "@/lib/silsilah/types"
export type { SilsilahTreePayload } from "@/lib/silsilah/tree"
export { getSilsilahTreePayload } from "@/lib/silsilah/tree.server"

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

export class SilsilahService {
  static getPersonById = cache(async (id: string) => {
    return prisma.person.findUnique({
      where: { id },
      include: personInclude,
    })
  })

  static async getPersonAuditLogs(personId: string) {
    return prisma.personAuditLog.findMany({
      where: { personId },
      orderBy: { createdAt: "desc" },
    })
  }

  static async getPersonAuditLogsForActor(
    actorPersonId: string,
    targetPersonId: string,
  ) {
    if (!(await isFamilyScope(actorPersonId, targetPersonId))) {
      throw new ManageForbiddenError(
        "Anda tidak memiliki akses ke log audit anggota ini.",
      )
    }

    const person = await SilsilahService.getPersonById(targetPersonId)

    if (!person) {
      return null
    }

    return SilsilahService.getPersonAuditLogs(targetPersonId)
  }

  static async getPersonDetailForViewer(
    actorPersonId: string,
    targetPersonId: string,
  ): Promise<PersonDetailResult | null> {
    const person = await SilsilahService.getPersonById(targetPersonId)

    if (!person) {
      return null
    }

    const canManage = await isFamilyScope(actorPersonId, targetPersonId)

    if (canManage) {
      const viewer = await SilsilahService.getPersonById(actorPersonId)
      const { buildPersonViewerContext } = await import(
        "@/lib/silsilah/person-relation-context"
      )
      const viewerContext = viewer
        ? buildPersonViewerContext(viewer, person)
        : null

      return { access: "full", person, viewerContext }
    }

    return {
      access: "limited",
      person: {
        id: person.id,
        fullName: person.fullName,
        nickname: person.nickname,
        gender: person.gender,
        isAlive: person.isAlive,
        photoUrl: person.photoUrl,
        age: getDisplayAge(person.birthDate, {
          deathDate: person.deathDate,
          isAlive: person.isAlive,
        }),
        phone: person.phone,
        address: person.address,
      },
    }
  }
}

export type PersonDetailResult =
  | {
      access: "full"
      person: PersonWithRelations
      viewerContext: import("@/lib/silsilah/person-relation-context").PersonViewerContext | null
    }
  | { access: "limited"; person: PersonDetailLimited }

export type PersonAuditLogEntry = Awaited<
  ReturnType<typeof SilsilahService.getPersonAuditLogs>
>[number]
