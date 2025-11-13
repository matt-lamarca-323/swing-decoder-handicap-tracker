import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient, Role } from "@prisma/client"
import prisma from "@/lib/prisma"
import { verifyPassword } from "@/lib/password"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "checkbox" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user || !user.password) {
          throw new Error("Invalid email or password")
        }

        const isValidPassword = await verifyPassword(
          credentials.password as string,
          user.password
        )

        if (!isValidPassword) {
          throw new Error("Invalid email or password")
        }

        // Return user object with remember me flag
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          rememberMe: credentials.rememberMe === "true"
        } as any
      }
    })
  ],
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days default
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false

      // For Credentials provider, user is already validated in authorize()
      if (account?.provider === "credentials") {
        return true
      }

      // Check if this is the first user in the database
      const userCount = await prisma.user.count()

      // If this is the first user, make them an admin
      if (userCount === 0) {
        // The user will be created by the adapter, but we'll update their role after
        return true
      }

      // Check if a user with this email already exists (for linking)
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
        include: { accounts: true }
      })

      // If user exists but has no OAuth accounts, we'll link this account
      if (existingUser && existingUser.accounts.length === 0) {
        console.log(`Linking Google account to existing user: ${user.email}`)
        return true
      }

      return true
    },
    async session({ session, user, token }) {
      // Add user id and role to the session
      if (session.user) {
        // For credentials login, user info comes from token
        if (token?.sub) {
          const dbUser = await prisma.user.findUnique({
            where: { id: parseInt(token.sub) },
            select: { id: true, role: true, email: true, name: true, image: true }
          })

          if (dbUser) {
            session.user.id = dbUser.id.toString()
            session.user.role = dbUser.role
            session.user.email = dbUser.email
            session.user.name = dbUser.name
            session.user.image = dbUser.image
          }
        } else {
          // For OAuth login, user info comes from user object
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true, role: true }
          })

          if (dbUser) {
            session.user.id = dbUser.id.toString()
            session.user.role = dbUser.role
          }
        }
      }
      return session
    },
    async jwt({ token, user }) {
      // Add user info to token for JWT strategy (if we switch to JWT later)
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    }
  },
  events: {
    async createUser({ user }) {
      // Check if this is the first user and make them an admin
      const userCount = await prisma.user.count()

      if (userCount === 1 && user.email) {
        await prisma.user.update({
          where: { email: user.email },
          data: { role: Role.ADMIN }
        })
        console.log(`First user created as ADMIN: ${user.email}`)
      }
    },
    async linkAccount({ user, account }) {
      // Update existing user when OAuth account is linked
      if (user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email }
        })

        if (existingUser) {
          console.log(`OAuth account linked to existing user: ${user.email}`)
        }
      }
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
})
