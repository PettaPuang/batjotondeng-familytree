import { NextResponse } from "next/server"

import { canManagePerson } from "@/lib/auth/person-scope"
import { forbiddenResponse, requireApiSession } from "@/lib/api/unauthorized"
import { getPersonAuditLogs, getPersonById } from "@/lib/silsilah/queries"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { response, actor } = await requireApiSession()
  if (response) return response

  const { id } = await context.params

  if (!(await canManagePerson(actor.personId, id))) {
    return forbiddenResponse("Anda tidak memiliki akses ke log audit anggota ini.")
  }

  const person = await getPersonById(id)

  if (!person) {
    return NextResponse.json({ error: "Person not found" }, { status: 404 })
  }

  const logs = await getPersonAuditLogs(id)

  return NextResponse.json(logs)
}
