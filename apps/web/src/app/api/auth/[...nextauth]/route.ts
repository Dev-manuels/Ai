import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Institutional Access",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "analyst@hedgefund.com" },
        password: { label: "Access Token", type: "password" }
      },
      async authorize(credentials) {
        // Institutional verification logic
        if (credentials?.email && credentials?.password === "hedgefund-token") {
          return { id: "1", name: "Senior Analyst", email: credentials.email, role: "ADMIN" };
        }
        return null;
      }
    })
  ],
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
