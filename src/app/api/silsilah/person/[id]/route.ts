import { NextResponse } from "next/server"

import { ManageForbiddenError } from "@/lib/auth/errors"
import { forbiddenResponse, requireApiSession } from "@/lib/api/unauthorized"
import { getPersonDetailForViewer } from "@/lib/silsilah/queries"
import {
  deletePersonById,
  jsonBodyToFormData,
  updatePersonFromForm,
} from "@/lib/silsilah/person-mutations"
import { prismaErrorMessage } from "@/lib/silsilah/prisma-error"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { response, actor } = await requireApiSession()
  if (response) return response

  const { id } = await context.params
  const detail = await getPersonDetailForViewer(actor.personId, id)

  if (!detail) {
    return NextResponse.json({ error: "Person not found" }, { status: 404 })
  }

  if (detail.access === "limited") {
    return NextResponse.json({
      access: "limited",
      person: detail.person,
    })
  }

  return NextResponse.json({
    access: "full",
    person: detail.person,
    viewerContext: detail.viewerContext,
  })
}

export async function PUT(request: Request, context: RouteContext) {
  const { response, actor } = await requireApiSession()
  if (response) return response

  const { id } = await context.params

  try {
    const body = (await request.json()) as Record<string, unknown>
    const after = await updatePersonFromForm(actor, id, jsonBodyToFormData(body))

    return NextResponse.json(after)
  } catch (error) {
    if (error instanceof ManageForbiddenError) {
      return forbiddenResponse(error.message)
    }

    const mapped = prismaErrorMessage(error)
    if (mapped) {
      return NextResponse.json({ error: mapped }, { status: 400 })
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
    await deletePersonById(actor, id)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof ManageForbiddenError) {
      return forbiddenResponse(error.message)
    }

    const mapped = prismaErrorMessage(error)
    if (mapped) {
      return NextResponse.json({ error: mapped }, { status: 400 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal menghapus." },
      { status: 400 },
    )
  }
}
