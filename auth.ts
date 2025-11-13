import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient, Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
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
    strategy: "jwt", // Use JWT for edge runtime compatibility
    maxAge: 30 * 24 * 60 * 60, // 30 days default
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token-jwt`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) {
        console.log('[Auth] Sign-in rejected: No email provided')
        return false
      }

      // For Credentials provider, user is already validated in authorize()
      if (account?.provider === "credentials") {
        console.log(`[Auth] Credentials sign-in: ${user.email}`)
        return true
      }

      // For OAuth providers (Google), allow sign-in
      // The PrismaAdapter will automatically:
      // 1. Create a new user if email doesn't exist
      // 2. Link the OAuth account to the user
      // 3. Update existing user info if user already exists
      console.log(`[Auth] OAuth sign-in with ${account?.provider}: ${user.email}`)

      return true
    },
    async jwt({ token, user, account, trigger }) {
      // Initial sign in - fetch user data from database
      if (user && user.email) {
        // Add a small delay to ensure user creation is complete (for OAuth flows)
        if (account?.provider && account.provider !== "credentials") {
          await new Promise(resolve => setTimeout(resolve, 150))
        }

        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, role: true, email: true, name: true, image: true }
        })

        if (dbUser) {
          // Check if this is the first user and should be admin
          const userCount = await prisma.user.count()
          let userRole = dbUser.role

          // If this is the first user and not already admin, update to admin
          if (userCount === 1 && dbUser.role !== Role.ADMIN) {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { role: Role.ADMIN }
            })
            userRole = Role.ADMIN
            console.log(`[Auth] First user promoted to ADMIN: ${dbUser.email}`)
          }

          token.id = dbUser.id.toString()
          token.role = userRole
          token.email = dbUser.email
          token.name = dbUser.name
          token.picture = dbUser.image
          console.log(`[Auth] JWT token created for user: ${dbUser.email} (Role: ${userRole})`)
        } else {
          console.log(`[Auth] Warning: User not found in database yet: ${user.email}`)
        }
      }

      // Refresh token data on update
      if (trigger === "update" && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: parseInt(token.id as string) },
          select: { id: true, role: true, email: true, name: true, image: true }
        })

        if (dbUser) {
          token.role = dbUser.role
          token.email = dbUser.email
          token.name = dbUser.name
          token.picture = dbUser.image
          console.log(`[Auth] JWT token refreshed for user: ${dbUser.email}`)
        }
      }

      return token
    },
    async session({ session, token }) {
      // Add user data from token to session
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string | null
      }
      return session
    }
  },
  events: {
    async createUser({ user }) {
      console.log(`[Auth] New user created: ${user.email}`)

      // Check if this is the first user and make them an admin
      const userCount = await prisma.user.count()

      if (userCount === 1 && user.email) {
        await prisma.user.update({
          where: { email: user.email },
          data: { role: Role.ADMIN }
        })
        console.log(`[Auth] First user assigned ADMIN role: ${user.email}`)
      } else {
        console.log(`[Auth] User created with USER role: ${user.email}`)
      }
    },
    async linkAccount({ user, account }) {
      console.log(`[Auth] OAuth account (${account.provider}) linked to user: ${user.email}`)
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
})
