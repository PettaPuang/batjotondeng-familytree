import type { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"

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
