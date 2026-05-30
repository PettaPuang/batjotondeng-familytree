import { NextResponse } from "next/server"

import { ManageForbiddenError } from "@/lib/auth/errors"
import { assertCanLinkParent } from "@/lib/auth/person-scope"
import { forbiddenResponse, requireApiSession } from "@/lib/api/unauthorized"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const { response, actor } = await requireApiSession()
  if (response) return response

  const body = await request.json()
  const childId = body.childId as string | undefined
  const marriageId = body.marriageId as string | undefined

  if (!childId || !marriageId) {
    return NextResponse.json(
      { error: "childId dan marriageId wajib diisi" },
      { status: 400 },
    )
  }

  try {
    await assertCanLinkParent(actor.personId, childId, marriageId)

    const link = await prisma.personParent.upsert({
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
      include: {
        child: true,
        marriage: {
          include: {
            husband: true,
            wife: true,
          },
        },
      },
    })

    return NextResponse.json(link, { status: 201 })
  } catch (error) {
    if (error instanceof ManageForbiddenError) {
      return forbiddenResponse(error.message)
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal menghubungkan." },
      { status: 400 },
    )
  }
}
