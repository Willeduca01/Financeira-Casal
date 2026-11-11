import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "./prisma";

/**
 * Restaura todos os arquivos de autenticação do Neon Postgres para o disco local.
 * Essencial para hospedar em nuvens com disco efêmero (Render, Koyeb, Railway).
 */
export async function restoreSessionFromNeon(authFolder: string): Promise<boolean> {
  try {
    await fs.mkdir(authFolder, { recursive: true });

    const sessions = await prisma.whatsAppSession.findMany();
    if (!sessions || sessions.length === 0) {
      console.log("ℹ️ [NEON_SESSION] Nenhuma sessão prévia encontrada no Neon.");
      return false;
    }

    console.log(
      `📥 [NEON_SESSION] Restaurando ${sessions.length} arquivos de sessão do Neon Postgres...`
    );

    for (const session of sessions) {
      const filePath = path.join(authFolder, session.id);
      await fs.writeFile(filePath, session.data, "utf-8");
    }

    console.log("✅ [NEON_SESSION] Sessão restaurada com sucesso do Neon!");
    return true;
  } catch (error) {
    console.warn("⚠️ [NEON_SESSION] Falha ao restaurar sessão do Neon:", error);
    return false;
  }
}

/**
 * Salva todos os arquivos da pasta local de autenticação no Neon Postgres.
 */
export async function backupSessionToNeon(authFolder: string): Promise<void> {
  try {
    const exists = await fs
      .access(authFolder)
      .then(() => true)
      .catch(() => false);

    if (!exists) return;

    const files = await fs.readdir(authFolder);
    if (files.length === 0) return;

    let savedCount = 0;
    for (const file of files) {
      try {
        const filePath = path.join(authFolder, file);
        const stat = await fs.stat(filePath).catch(() => null);
        if (stat && stat.isFile()) {
          const content = await fs.readFile(filePath, "utf-8");
          await prisma.whatsAppSession.upsert({
            where: { id: file },
            update: { data: content },
            create: { id: file, data: content },
          });
          savedCount++;
        }
      } catch (err: any) {
        // Ignora arquivos temporários (como pre-key-*.json) que o Baileys rotaciona e deleta concorrentemente
        if (err?.code !== "ENOENT") {
          console.warn(`⚠️ [NEON_SESSION] Erro ao sincronizar ${file}:`, err);
        }
      }
    }

    if (savedCount > 0) {
      console.log(`💾 [NEON_SESSION] ${savedCount} arquivos de sessão sincronizados no Neon.`);
    }
  } catch (error) {
    console.error("❌ [NEON_SESSION] Erro ao sincronizar sessão para o Neon:", error);
  }
}

/**
 * Limpa a sessão no Neon quando o usuário se desconecta.
 */
export async function clearSessionInNeon(): Promise<void> {
  try {
    await prisma.whatsAppSession.deleteMany({});
    console.log("🧹 [NEON_SESSION] Sessão do WhatsApp removida do Neon.");
  } catch (error) {
    console.error("❌ [NEON_SESSION] Erro ao limpar sessão no Neon:", error);
  }
}

