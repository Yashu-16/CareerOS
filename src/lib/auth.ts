import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

/**
 * Shared next-auth configuration. Exported so both the route handler and
 * `getServerSession(authOptions)` calls use the exact same options.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findFirst({
          where: { email: credentials.email, deletedAt: null },
        })

        if (!user || !user.password) return null
        if (!user.emailVerified) throw new Error('EMAIL_NOT_VERIFIED')

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) throw new Error('INVALID_CREDENTIALS')

        return { id: user.id, email: user.email, name: user.name, role: user.role }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const existing = await prisma.user.findUnique({ where: { email: user.email! } })
        if (!existing) {
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              avatarUrl: user.image,
              googleId: account.providerAccountId,
              emailVerified: true,
            },
          })
        } else if (!existing.googleId) {
          await prisma.user.update({
            where: { email: user.email! },
            data: { googleId: account.providerAccountId },
          })
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user || !token.id) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email! } })
        token.id = dbUser?.id
        token.role = dbUser?.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
