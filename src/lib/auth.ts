import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Hash de contingência seguro para o PIN padrão 1234 (salt rounds = 10)
const DEV_FALLBACK_PIN_HASH = "$2b$10$0LY2cW0VOdAe220DnhTu2ObpORd72LVgsGZds/252ETATPl0iCSIG";

if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === "production") {
  throw new Error(
    "CRITICAL SECURITY CONFIGURATION: A variável de ambiente NEXTAUTH_SECRET é estritamente obrigatória em produção."
  );
}

export const authOptions: any = {
  providers: [
    CredentialsProvider({
      name: "Perfil do Casal",
      credentials: {
        email: { label: "E-mail", type: "email", placeholder: "lucas@casal.com" },
        password: { label: "Senha ou PIN", type: "password" },
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const normalizedEmail = credentials.email.trim().toLowerCase();
        let userRecord = null;

        // 1. Tentar buscar o usuário diretamente no Neon PostgreSQL
        try {
          if (process.env.DATABASE_URL) {
            userRecord = await prisma.user.findUnique({
              where: { email: normalizedEmail },
            });
          }
        } catch (dbError) {
          console.warn("[AUTH] Falha ao consultar banco Neon, verificando modo dev:", dbError);
        }

        // 2. Verificação de senha / PIN usando exclusivamente comparação de Hash Bcrypt (sem texto puro)
        if (userRecord) {
          const storedHash = userRecord.passwordHash || userRecord.pinHash;
          if (!storedHash) return null;

          const isValid = await bcrypt.compare(credentials.password, storedHash);
          if (!isValid) return null;

          return {
            id: userRecord.id,
            name: userRecord.name,
            email: userRecord.email,
            image: userRecord.avatar || undefined,
          };
        }

        // Em produção, se o usuário não existir no banco, rejeita imediatamente
        if (process.env.NODE_ENV === "production") {
          return null;
        }

        // Fallback apenas para desenvolvimento local se banco não estiver conectado
        const isUser1 = normalizedEmail.includes("william") || normalizedEmail.includes("lucas");
        const isUser2 = normalizedEmail.includes("laura") || normalizedEmail.includes("mariana");
        if (!isUser1 && !isUser2) return null;

        const isValidDevPin = await bcrypt.compare(credentials.password, DEV_FALLBACK_PIN_HASH);
        if (!isValidDevPin) return null;

        if (isUser1) {
          return {
            id: "cmvgv5a7p0000uai46r748p2a",
            name: "William Santos",
            email: "william@casal.com",
            image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
          };
        }

        return {
          id: "cmvgv5ag40001uai4go52d5h3",
          name: "Laura Xavier",
          email: "laura@casal.com",
          image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 14400, // 4 horas de sessão máxima
  },
  jwt: {
    maxAge: 14400, // 4 horas
  },
  callbacks: {
    async session({ session, token }: any) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "financas-casal-secret-key-2026",
};
