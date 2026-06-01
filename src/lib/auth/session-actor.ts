import type { Session } from "next-auth"

import { auth } from "@/auth"

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
  const session = await auth()

  if (!session?.user?.personId) {
    throw new Error("UNAUTHORIZED")
  }

  return sessionToActor(session)
}
