import { auth } from "@/auth"

export async function requireSession() {
  const session = await auth()

  if (!session?.user?.personId) {
    throw new Error("UNAUTHORIZED")
  }

  return session
}
