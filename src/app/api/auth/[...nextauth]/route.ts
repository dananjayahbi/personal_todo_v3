import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { verifyPassword } from "@/lib/password"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials")
          return null
        }

        try {
          console.log("Attempting login with email:", credentials.email)
          // Find user in database
          const user = await db.user.findUnique({
            where: { email: credentials.email }
          })

          console.log("Found user:", user ? { id: user.id, email: user.email, name: user.name } : null)

          if (!user) {
            console.log("User not found in database")
            return null
          }

          // Verify hashed password
          const isPasswordValid = await verifyPassword(credentials.password, user.password)
          console.log("Password verification result:", isPasswordValid)
          
          if (!isPasswordValid) {
            console.log("Password verification failed")
            return null
          }

          console.log("Authentication successful for user:", user.email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        } catch (error) {
          console.error("Authentication error:", error)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        console.log("JWT callback - initial user setup:", { id: token.id, email: token.email, name: token.name })
      }
      
      // If the session is being updated (like after profile update)
      if (trigger === "update" && session) {
        console.log("JWT callback - updating session with:", session)
        console.log("JWT callback - current token.id:", token.id)
        console.log("JWT callback - current token.email:", token.email)
        // Use the session data directly since it contains the updated information
        console.log("JWT callback - session contains updated data, using it directly")
        token.name = session.name
        token.email = session.email
        console.log("JWT callback - updated token with session data:", { name: token.name, email: token.email })
      }
      
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string
      }
      console.log("Session callback - returning session:", session)
      return session
    },
  },
})

export { handler as GET, handler as POST }
