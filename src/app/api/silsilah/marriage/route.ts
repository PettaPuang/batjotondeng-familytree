import { NextResponse } from "next/server"

import { ManageForbiddenError } from "@/lib/auth/errors"
import { assertCanCreateMarriage } from "@/lib/auth/person-scope"
import { forbiddenResponse, requireApiSession } from "@/lib/api/unauthorized"
import { parseDateInput } from "@/lib/silsilah/format"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const { response } = await requireApiSession()
  if (response) return response

  const marriages = await prisma.marriage.findMany({
    include: {
      husband: true,
      wife: true,
      children: true,
    },
    orderBy: { marriageDate: "desc" },
  })

  return NextResponse.json(marriages)
}

export async function POST(request: Request) {
  const { response, actor } = await requireApiSession()
  if (response) return response

  try {
    const body = await request.json()
    const husbandId = String(body.husbandId ?? "")
    const wifeId = String(body.wifeId ?? "")
    const marriageDate = parseDateInput(String(body.marriageDate ?? ""))

    if (!husbandId || !wifeId) {
      return NextResponse.json(
        { error: "husbandId dan wifeId wajib diisi" },
        { status: 400 },
      )
    }

    await assertCanCreateMarriage(actor.personId, husbandId, wifeId)

    const marriage = await prisma.marriage.create({
      data: {
        husbandId,
        wifeId,
        marriageDate,
        isActive: true,
      },
      include: {
        husband: true,
        wife: true,
      },
    })

    return NextResponse.json(marriage, { status: 201 })
  } catch (error) {
    if (error instanceof ManageForbiddenError) {
      return forbiddenResponse(error.message)
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal menyimpan." },
      { status: 400 },
    )
  }
}
