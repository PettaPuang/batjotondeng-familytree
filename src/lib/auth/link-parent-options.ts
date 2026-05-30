import { assertCanManagePerson } from "@/lib/auth/person-scope"
import { prisma } from "@/lib/prisma"

export async function getParentLinkMarriageOptions(
  actorPersonId: string,
  childId: string,
) {
  await assertCanManagePerson(actorPersonId, childId)

  if (childId === actorPersonId) {
    return prisma.marriage.findMany({
      include: {
        husband: { select: { fullName: true } },
        wife: { select: { fullName: true } },
      },
      orderBy: { marriageDate: "desc" },
    })
  }

  return prisma.marriage.findMany({
    where: {
      OR: [{ husbandId: actorPersonId }, { wifeId: actorPersonId }],
    },
    include: {
      husband: { select: { fullName: true } },
      wife: { select: { fullName: true } },
    },
    orderBy: { marriageDate: "desc" },
  })
}
