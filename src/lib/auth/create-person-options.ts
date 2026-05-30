import { prisma } from "@/lib/prisma"

export type CreatePersonRelationOption = {
  marriages: {
    id: string
    label: string
  }[]
  parentMarriages: {
    id: string
    label: string
  }[]
}

export async function getCreatePersonRelationOptions(
  actorPersonId: string,
): Promise<CreatePersonRelationOption> {
  const actor = await prisma.person.findUnique({
    where: { id: actorPersonId },
    include: {
      parents: {
        include: {
          marriage: {
            include: {
              husband: { select: { fullName: true } },
              wife: { select: { fullName: true } },
            },
          },
        },
      },
      marriages: {
        include: {
          husband: { select: { fullName: true } },
          wife: { select: { fullName: true } },
        },
      },
      marriages2: {
        include: {
          husband: { select: { fullName: true } },
          wife: { select: { fullName: true } },
        },
      },
    },
  })

  if (!actor) {
    return { marriages: [], parentMarriages: [] }
  }

  const marriages = [...actor.marriages, ...actor.marriages2].map((marriage) => ({
    id: marriage.id,
    label: `${marriage.husband.fullName} & ${marriage.wife.fullName}`,
  }))

  const parentMarriages = actor.parents.map((link) => ({
    id: link.marriageId,
    label: `${link.marriage.husband.fullName} & ${link.marriage.wife.fullName}`,
  }))

  return { marriages, parentMarriages }
}
