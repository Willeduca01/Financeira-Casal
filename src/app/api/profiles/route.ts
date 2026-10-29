import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/profiles
 * Endpoint público mínimo exclusivo para a tela de seleção de perfil.
 * Retorna ESTRITAMENTE { id, name, avatar }.
 * NUNCA expõe pinHash, passwordHash, e-mail, salários ou finanças.
 */
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        avatar: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(users, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=60",
      },
    });
  } catch (error) {
    console.error("[PROFILES_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Erro ao carregar perfis" },
      { status: 500 }
    );
  }
}
