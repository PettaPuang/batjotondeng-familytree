import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      personId: string
    } & DefaultSession["user"]
  }

  interface User {
    personId: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    personId?: string
  }
}
