import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [],
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
} satisfies NextAuthConfig
