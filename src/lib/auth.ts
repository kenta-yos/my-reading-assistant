import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { prisma } from './prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [Google],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user, profile }) {
      if (!profile?.email) return false

      // ユーザーをDBに作成 or 更新
      await prisma.user.upsert({
        where: { email: profile.email },
        create: {
          email: profile.email,
          name: user.name ?? profile.name ?? null,
          image: user.image ?? (profile as Record<string, unknown>).picture as string ?? null,
        },
        update: {
          name: user.name ?? profile.name ?? null,
          image: user.image ?? (profile as Record<string, unknown>).picture as string ?? null,
        },
      })
      return true
    },
    async jwt({ token, profile }) {
      if (profile?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: profile.email },
        })
        if (dbUser) {
          token.id = dbUser.id
        }
      }
      return token
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})
