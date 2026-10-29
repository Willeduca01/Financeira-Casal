import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error(
    "CRITICAL SECURITY CONFIGURATION: A variável de ambiente NEXTAUTH_SECRET é estritamente obrigatória em todos os ambientes."
  );
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Perfil do Casal",
      credentials: {
        userId: { label: "User ID", type: "text" },
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha ou PIN", type: "password" },
      },
      async authorize(credentials: Record<string, string> | undefined) {
        if ((!credentials?.userId && !credentials?.email) || !credentials?.password) {
          return null;
        }

        if (!process.env.DATABASE_URL) {
          throw new Error("DATABASE_URL não configurada.");
        }

        const normalizedEmail = credentials.email?.trim().toLowerCase();

        // 1. Buscar o usuário diretamente no Neon PostgreSQL pelo ID ou e-mail
        const userRecord = await prisma.user.findFirst({
          where: credentials.userId
            ? { id: credentials.userId }
            : { email: normalizedEmail },
        });

        if (!userRecord) {
          return null;
        }

        // 2. Verificação de senha / PIN usando comparação de Hash Bcrypt no servidor
        const storedHash = userRecord.passwordHash || userRecord.pinHash;
        if (!storedHash) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, storedHash);
        if (!isValid) {
          return null;
        }

        return {
          id: userRecord.id,
          name: userRecord.name,
          email: userRecord.email,
          image: userRecord.avatar || undefined,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 14400, // 4 horas
  },
  jwt: {
    maxAge: 14400,
  },
  callbacks: {
    async session({ session, token }) {
      if (session?.user && token?.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

