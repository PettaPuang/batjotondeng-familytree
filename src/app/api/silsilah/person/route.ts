import { NextResponse } from "next/server"

import {
  assertCanCreatePersonWithRelation,
  parseCreatePersonRelation,
} from "@/lib/auth/person-scope"
import { ManageForbiddenError } from "@/lib/auth/errors"
import { forbiddenResponse, requireApiSession } from "@/lib/api/unauthorized"
import {
  createPersonFromForm,
  jsonBodyToFormData,
} from "@/lib/silsilah/person-mutations"
import { getSilsilahTreePayload } from "@/lib/silsilah/queries"

export async function GET() {
  const { response } = await requireApiSession()
  if (response) return response

  const payload = await getSilsilahTreePayload()
  return NextResponse.json(payload.persons)
}

export async function POST(request: Request) {
  const { response, actor } = await requireApiSession()
  if (response) return response

  try {
    const body = (await request.json()) as Record<string, unknown>
    const formData = jsonBodyToFormData(body)
    const relation = parseCreatePersonRelation(formData)
    await assertCanCreatePersonWithRelation(actor.personId, relation)

    const person = await createPersonFromForm(actor, formData, relation)

    return NextResponse.json(person, { status: 201 })
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
