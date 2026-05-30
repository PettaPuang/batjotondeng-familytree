import { NextResponse } from "next/server"

import { requireApiSession } from "@/lib/api/unauthorized"
import { getPersonAuditLogs, getPersonById } from "@/lib/silsilah/queries"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { response } = await requireApiSession()
  if (response) return response

  const { id } = await context.params
  const person = await getPersonById(id)

  if (!person) {
    return NextResponse.json({ error: "Person not found" }, { status: 404 })
  }

  const logs = await getPersonAuditLogs(id)

  return NextResponse.json(logs)
}
