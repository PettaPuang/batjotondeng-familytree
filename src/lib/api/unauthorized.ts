import { NextResponse } from "next/server"
import type { Session } from "next-auth"

import { auth } from "@/auth"
import { sessionToActor, type SessionActor } from "@/lib/auth/session-actor"

export async function requireApiSession(): Promise<
  | { session: null; actor: null; response: NextResponse }
  | { session: Session; actor: SessionActor; response: null }
> {
  const session = await auth()

  if (!session?.user?.personId) {
    return {
      session: null,
      actor: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  return {
    session,
    actor: sessionToActor(session),
    response: null,
  }
}

export function forbiddenResponse(message: string) {
  return NextResponse.json({ error: message }, { status: 403 })
}
