import { NextResponse } from "next/server"

import { ManageForbiddenError } from "@/lib/auth/errors"
import { assertActorInMarriage } from "@/lib/auth/person-scope"
import { forbiddenResponse, requireApiSession } from "@/lib/api/unauthorized"
import { parseDateInput } from "@/lib/silsilah/format"
import { prisma } from "@/lib/prisma"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { response } = await requireApiSession()
  if (response) return response

  const { id } = await context.params

  const marriage = await prisma.marriage.findUnique({
    where: { id },
    include: {
      husband: true,
      wife: true,
      children: {
        include: {
          child: true,
        },
      },
    },
  })

  if (!marriage) {
    return NextResponse.json({ error: "Marriage not found" }, { status: 404 })
  }

  return NextResponse.json(marriage)
}

export async function PUT(request: Request, context: RouteContext) {
  const { response, actor } = await requireApiSession()
  if (response) return response

  const { id } = await context.params

  try {
    await assertActorInMarriage(actor.personId, id)

    const body = await request.json()
    const marriageDate = body.marriageDate
      ? parseDateInput(String(body.marriageDate))
      : undefined

    const marriage = await prisma.marriage.update({
      where: { id },
      data: {
        ...(marriageDate !== undefined ? { marriageDate } : {}),
        ...(typeof body.isActive === "boolean" ? { isActive: body.isActive } : {}),
      },
      include: {
        husband: true,
        wife: true,
      },
    })

    return NextResponse.json(marriage)
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

export async function DELETE(_request: Request, context: RouteContext) {
  const { response, actor } = await requireApiSession()
  if (response) return response

  const { id } = await context.params

  try {
    await assertActorInMarriage(actor.personId, id)

    await prisma.marriage.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof ManageForbiddenError) {
      return forbiddenResponse(error.message)
    }

    throw error
  }
}
