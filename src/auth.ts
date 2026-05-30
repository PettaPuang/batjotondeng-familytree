import { headers } from "next/headers"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

import {
  checkLoginRateLimit,
  clearLoginRateLimit,
  loginRateLimitKey,
  recordLoginFailure,
} from "@/lib/auth/login-rate-limit"
import { verifyPersonIdentity } from "@/lib/verify-person"

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
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
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? ""
        session.user.personId = (token.personId as string | undefined) ?? token.sub ?? ""
        session.user.name = token.name
      }

      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        token.personId = user.personId
        token.name = user.name
      }

      return token
    },
  },
})
