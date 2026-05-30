import { NextResponse } from "next/server"

import { requireApiSession } from "@/lib/api/unauthorized"
import { getSilsilahTreePayload } from "@/lib/silsilah/queries"

export async function GET() {
  const { response } = await requireApiSession()
  if (response) return response

  const payload = await getSilsilahTreePayload()

  return NextResponse.json(payload)
}
