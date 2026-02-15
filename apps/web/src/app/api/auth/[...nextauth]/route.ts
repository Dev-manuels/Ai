import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Institutional Access",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "analyst@hedgefund.com" },
        password: { label: "Access Token", type: "password" }
      },
      async authorize(credentials) {
        const adminToken = process.env.ADMIN_ACCESS_TOKEN;
        
        if (!adminToken) {
          console.error("CRITICAL: ADMIN_ACCESS_TOKEN is not set in environment variables");
          return null;
        }

        // Institutional verification logic
        if (credentials?.email && credentials?.password === adminToken) {
          return {
            id: "1",
            name: "Senior Analyst",
            email: credentials.email,
            role: "ADMIN"
          };
        }

        console.warn(`Unauthorized login attempt for: ${credentials?.email}`);
        return null;
      }
    })
  ],
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/signin",
  }
});

export { handler as GET, handler as POST };
