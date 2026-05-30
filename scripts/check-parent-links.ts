import "dotenv/config"

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function childrenOf(marriageLabel: string, husband: string, wife: string) {
  const marriage = await prisma.marriage.findFirst({
    where: {
      husband: { fullName: husband },
      wife: { fullName: wife },
    },
    include: {
      husband: { select: { fullName: true } },
      wife: { select: { fullName: true } },
      children: { include: { child: { select: { fullName: true } } } },
    },
  })

  if (!marriage) {
    console.log(`\n[${marriageLabel}] pernikahan tidak ditemukan`)
    return
  }

  console.log(`\n[${marriageLabel}] ${marriage.husband.fullName} & ${marriage.wife.fullName}`)
  for (const link of marriage.children) {
    console.log(`  anak (PersonParent): ${link.child.fullName}`)
  }
}

try {
  await childrenOf(
    "Puang",
    "Puang Batjo Tondeng",
    "Istri Puang",
  )
  await childrenOf(
    "Abdul",
    "Abdul Latif",
    "H. Singara Dg. Ti'no",
  )
  await childrenOf(
    "Ahmad+Rahmawati",
    "Ahmad Yusuf Rahim",
    "Rahmawati Latief",
  )
} finally {
  await prisma.$disconnect()
  await pool.end()
}
