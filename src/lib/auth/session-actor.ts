import type { Session } from "next-auth"

import { requireSession } from "@/lib/auth/require-session"

export type SessionActor = {
  personId: string
  name: string | null
}

export function sessionToActor(session: Session): SessionActor {
  const personId = session.user.personId

  if (!personId) {
    throw new Error("UNAUTHORIZED")
  }

  return {
    personId,
    name: session.user.name ?? null,
  }
}

export async function requireActor(): Promise<SessionActor> {
  const session = await requireSession()
  return sessionToActor(session)
}
