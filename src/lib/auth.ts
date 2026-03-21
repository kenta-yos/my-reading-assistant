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
    async signIn({ profile }) {
      if (!profile?.email) return false
      try {
        const existing = await prisma.user.findUnique({
          where: { email: profile.email },
        })
        if (!existing) {
          await prisma.user.create({
            data: {
              email: profile.email,
              name: (profile.name as string) ?? null,
              image: (profile.picture as string) ?? null,
            },
          })
        }
      } catch (e) {
        console.error('[auth] user upsert failed:', e)
      }
      return true
    },
    async jwt({ token, trigger, profile }) {
      if (trigger === 'signIn' && profile?.email) {
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
