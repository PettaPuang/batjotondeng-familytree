import { headers } from "next/headers"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

import { authConfig } from "@/auth.config"
import {
  checkLoginRateLimit,
  clearLoginRateLimit,
  loginRateLimitKey,
  recordLoginFailure,
} from "@/lib/auth/login-rate-limit"
import { verifyPersonIdentity } from "@/lib/verify-person"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        name: { label: "Nama", type: "text" },
        parentName: { label: "Nama Ayah atau Ibu", type: "text" },
        birthDate: { label: "Tanggal Lahir", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.name || !credentials?.parentName || !credentials?.birthDate) {
          return null
        }

        const name = credentials.name as string
        const parentName = credentials.parentName as string
        const birthDate = credentials.birthDate as string

        const headersList = await headers()
        const forwarded = headersList.get("x-forwarded-for")
        const ip = forwarded?.split(",")[0]?.trim() ?? "unknown"
        const rateKey = loginRateLimitKey(ip, name, birthDate)
        const rateCheck = checkLoginRateLimit(rateKey)

        if (!rateCheck.allowed) {
          return null
        }

        const person = await verifyPersonIdentity({
          name,
          parentName,
          birthDate,
        })

        if (!person) {
          recordLoginFailure(rateKey)
          return null
        }

        clearLoginRateLimit(rateKey)

        return {
          id: person.id,
          name: person.fullName,
          personId: person.id,
        }
      },
    }),
  ],
})
