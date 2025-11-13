import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient, Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { verifyPassword } from "@/lib/password"
import { logger } from "@/lib/logger"

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
        const startTime = logger.startTimer()
        const email = credentials?.email as string

        try {
          if (!credentials?.email || !credentials?.password) {
            logger.warn('Credentials sign-in attempt missing email or password')
            throw new Error("Email and password are required")
          }

          logger.debug('Credentials sign-in attempt', { auth: { email } })

          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string }
          })

          if (!user || !user.password) {
            logger.warn('Credentials sign-in failed - user not found or no password', {
              auth: { email }
            })
            throw new Error("Invalid email or password")
          }

          const isValidPassword = await verifyPassword(
            credentials.password as string,
            user.password
          )

          if (!isValidPassword) {
            logger.warn('Credentials sign-in failed - invalid password', {
              auth: { email, userId: user.id.toString() }
            })
            throw new Error("Invalid email or password")
          }

          const duration = logger.endTimer(startTime)
          logger.authEvent('signin', user.id.toString(), user.email, 'credentials', {
            performance: { duration_ms: duration },
            rememberMe: credentials.rememberMe === "true"
          })

          // Return user object with remember me flag
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            rememberMe: credentials.rememberMe === "true"
          } as any
        } catch (error) {
          const duration = logger.endTimer(startTime)
          logger.authError('credentials_signin', error as Error, email, 'credentials')
          throw error
        }
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
      const startTime = logger.startTimer()

      try {
        if (!user.email) {
          logger.warn('Sign-in rejected - no email provided', {
            auth: { provider: account?.provider }
          })
          return false
        }

        // For Credentials provider, user is already validated in authorize()
        if (account?.provider === "credentials") {
          const duration = logger.endTimer(startTime)
          logger.info('Credentials sign-in callback completed', {
            auth: { email: user.email, provider: 'credentials' },
            performance: { duration_ms: duration }
          })
          return true
        }

        // For OAuth providers (Google), allow sign-in
        // The PrismaAdapter will automatically:
        // 1. Create a new user if email doesn't exist
        // 2. Link the OAuth account to the user
        // 3. Update existing user info if user already exists
        const duration = logger.endTimer(startTime)
        logger.authEvent('signin', user.id, user.email, account?.provider, {
          performance: { duration_ms: duration },
          profile: profile ? { name: profile.name } : undefined
        })

        return true
      } catch (error) {
        const duration = logger.endTimer(startTime)
        logger.authError('signin_callback', error as Error, user.email, account?.provider)
        return false
      }
    },
    async jwt({ token, user, account, trigger }) {
      const startTime = logger.startTimer()

      try {
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
              logger.info('First user promoted to ADMIN', {
                auth: { userId: dbUser.id.toString(), email: dbUser.email },
                database: { operation: 'update', model: 'User' }
              })
            }

            token.id = dbUser.id.toString()
            token.role = userRole
            token.email = dbUser.email
            token.name = dbUser.name
            token.picture = dbUser.image

            const duration = logger.endTimer(startTime)
            logger.authEvent('session_created', dbUser.id.toString(), dbUser.email, account?.provider, {
              auth: { role: userRole },
              performance: { duration_ms: duration }
            })
          } else {
            logger.warn('User not found in database during JWT creation', {
              auth: { email: user.email, provider: account?.provider }
            })
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

            const duration = logger.endTimer(startTime)
            logger.info('JWT token refreshed', {
              auth: { userId: dbUser.id.toString(), email: dbUser.email, role: dbUser.role },
              performance: { duration_ms: duration }
            })
          }
        }

        return token
      } catch (error) {
        const duration = logger.endTimer(startTime)
        logger.error('JWT callback failed', error as Error, {
          auth: { trigger, email: user?.email },
          performance: { duration_ms: duration }
        })
        return token
      }
    },
    async session({ session, token }) {
      try {
        // Add user data from token to session
        if (session.user && token) {
          session.user.id = token.id as string
          session.user.role = token.role as Role
          session.user.email = token.email as string
          session.user.name = token.name as string
          session.user.image = token.picture as string | null

          logger.debug('Session callback completed', {
            auth: { userId: token.id as string, role: token.role as string }
          })
        }
        return session
      } catch (error) {
        logger.error('Session callback failed', error as Error)
        return session
      }
    }
  },
  events: {
    async createUser({ user }) {
      const startTime = logger.startTimer()

      try {
        logger.info('New user created', {
          auth: { userId: user.id, email: user.email },
          database: { operation: 'create', model: 'User' }
        })

        // Check if this is the first user and make them an admin
        const userCount = await prisma.user.count()

        if (userCount === 1 && user.email) {
          await prisma.user.update({
            where: { email: user.email },
            data: { role: Role.ADMIN }
          })

          const duration = logger.endTimer(startTime)
          logger.authEvent('signup', user.id, user.email, undefined, {
            auth: { role: 'ADMIN', firstUser: true },
            performance: { duration_ms: duration }
          })
        } else {
          const duration = logger.endTimer(startTime)
          logger.authEvent('signup', user.id, user.email, undefined, {
            auth: { role: 'USER' },
            performance: { duration_ms: duration }
          })
        }
      } catch (error) {
        const duration = logger.endTimer(startTime)
        logger.error('Create user event failed', error as Error, {
          auth: { email: user.email },
          performance: { duration_ms: duration }
        })
      }
    },
    async linkAccount({ user, account }) {
      logger.info('OAuth account linked to user', {
        auth: {
          userId: user.id,
          email: user.email,
          provider: account.provider,
          providerAccountId: account.providerAccountId
        },
        database: { operation: 'link', model: 'Account' }
      })
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
})
