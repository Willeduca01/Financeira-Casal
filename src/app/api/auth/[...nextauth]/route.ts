import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Perfil do Casal",
      credentials: {
        email: { label: "E-mail", type: "email", placeholder: "lucas@casal.com" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        if (credentials.email.includes("lucas")) {
          return {
            id: "user-lucas",
            name: "Lucas Silva",
            email: "lucas@casal.com",
            image:
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
          };
        }

        return {
          id: "user-mariana",
          name: "Mariana Costa",
          email: "mariana@casal.com",
          image:
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "financas-casal-secret-key-2026",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
