import process from "node:process";
import http from "node:http";

// Carrega variáveis do arquivo .env automaticamente no Node 20+
try {
  process.loadEnvFile?.();
} catch {
  // Ignora se já estiver carregado no ambiente
}

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  type ConnectionState,
} from "@whiskeysockets/baileys";
import qrcodeTerminal from "qrcode-terminal";
import QRCode from "qrcode";
import pino from "pino";
import { Boom } from "@hapi/boom";
import {
  processFinancialMessage,
  isNumberAuthorized,
} from "../lib/whatsapp-core";
import {
  restoreSessionFromNeon,
  backupSessionToNeon,
  clearSessionInNeon,
} from "../lib/baileys-neon-store";

const AUTH_FOLDER = "./baileys_auth";
const PORT = Number(process.env.PORT) || 8080;

// Estado global do bot para a interface Web
let currentQrCode: string | null = null;
let isConnected = false;

/**
 * Servidor Web leve para o Render/Koyeb:
 * 1. Responde a / e /health para o Render manter o serviço online
 * 2. Disponibiliza a rota /qr para escanear o QR Code direto no navegador
 */
function startWebServer() {
  const server = http.createServer(async (req, res) => {
    const url = req.url || "/";

    if (url === "/health" || url === "/api/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "healthy", connected: isConnected }));
      return;
    }

    if (url === "/qr") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });

      if (isConnected) {
        res.end(`
          <!DOCTYPE html>
          <html lang="pt-BR">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Bot Conectado | Finanças Casal</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FBF9F5; color: #2D2824; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
                .card { background: white; border: 1px solid #E6DEC8; border-radius: 24px; padding: 36px; max-width: 440px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
                .icon { font-size: 54px; margin-bottom: 16px; }
                h1 { font-size: 24px; margin: 0 0 12px; color: #2C5E43; }
                p { color: #6D635B; line-height: 1.5; margin: 0 0 20px; }
                .badge { display: inline-block; background: #EBF3ED; color: #2C5E43; padding: 8px 16px; border-radius: 999px; font-weight: 600; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="icon">✅</div>
                <h1>WhatsApp Conectado!</h1>
                <p>O robô do casal está 100% online na nuvem e ouvindo as mensagens do WhatsApp.</p>
                <div class="badge">Status: Ativo & Operante 24h</div>
              </div>
            </body>
          </html>
        `);
        return;
      }

      if (!currentQrCode) {
        res.end(`
          <!DOCTYPE html>
          <html lang="pt-BR">
            <head>
              <meta charset="utf-8">
              <meta http-equiv="refresh" content="3">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Gerando QR Code...</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FBF9F5; color: #2D2824; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; }
                .spinner { width: 40px; height: 40px; border: 4px solid #E6DEC8; border-top-color: #C46D53; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
                @keyframes spin { to { transform: rotate(360deg); } }
              </style>
            </head>
            <body>
              <div>
                <div class="spinner"></div>
                <h2>Iniciando o WhatsApp do Bot...</h2>
                <p>Aguarde alguns segundos, esta página atualiza automaticamente.</p>
              </div>
            </body>
          </html>
        `);
        return;
      }

      try {
        const qrDataUrl = await QRCode.toDataURL(currentQrCode, {
          width: 320,
          margin: 2,
          color: { dark: "#2D2824", light: "#FFFFFF" },
        });

        res.end(`
          <!DOCTYPE html>
          <html lang="pt-BR">
            <head>
              <meta charset="utf-8">
              <meta http-equiv="refresh" content="12">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Escanear QR Code | Finanças Casal</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FBF9F5; color: #2D2824; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
                .card { background: white; border: 1px solid #E6DEC8; border-radius: 28px; padding: 32px; max-width: 440px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.06); }
                h1 { font-size: 22px; margin: 0 0 8px; color: #C46D53; }
                p { color: #6D635B; font-size: 14px; margin: 0 0 20px; }
                .qr-container { background: #FAF7F2; padding: 16px; border-radius: 20px; border: 2px dashed #E6DEC8; display: inline-block; margin-bottom: 20px; }
                .qr-img { width: 100%; max-width: 280px; height: auto; display: block; border-radius: 12px; }
                ol { text-align: left; color: #554D46; font-size: 14px; line-height: 1.6; padding-left: 20px; margin: 0; }
                li { margin-bottom: 6px; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>Conectar WhatsApp do Casal</h1>
                <p>Aponte a câmera do WhatsApp para o código abaixo:</p>
                <div class="qr-container">
                  <img class="qr-img" src="${qrDataUrl}" alt="QR Code WhatsApp" />
                </div>
                <ol>
                  <li>Abra o WhatsApp no celular do bot</li>
                  <li>Vá em <strong>Aparelhos Conectados</strong></li>
                  <li>Toque em <strong>Conectar um aparelho</strong></li>
                </ol>
              </div>
            </body>
          </html>
        `);
      } catch (err) {
        res.end("Erro ao gerar QR Code: " + String(err));
      }
      return;
    }

    // Rota padrão (/)
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        name: "Bot Financeiro do Casal",
        connected: isConnected,
        webQrUrl: "/qr",
        uptimeSeconds: Math.floor(process.uptime()),
      })
    );
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 [WEB_SERVER] Servidor web ativo na porta ${PORT}`);
    console.log(`📱 [WEB_QR] Acesse a rota /qr para escanear pelo navegador.`);
  });
}

async function startBaileysBot() {
  console.log("\n========================================================");
  console.log("   🤖 INICIANDO BOT FINANCEIRO DO CASAL (BAILEYS)");
  console.log("========================================================\n");

  // 1. Restaura a sessão prévia salva no Neon Postgres se estiver na nuvem
  await restoreSessionFromNeon(AUTH_FOLDER);

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(
    `📦 Usando Baileys v${version.join(".")} (Última versão: ${isLatest})`
  );

  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: state,
    browser: ["Financeira Casal", "Chrome", "1.0.0"],
  });

  // Salva credenciais localmente e sincroniza para o Neon Postgres
  sock.ev.on("creds.update", async () => {
    await saveCreds();
    await backupSessionToNeon(AUTH_FOLDER);
  });

  // Monitora alterações na conexão e atualiza QR Code
  sock.ev.on("connection.update", async (update: Partial<ConnectionState>) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      currentQrCode = qr;
      isConnected = false;

      console.log("\n======================================================");
      console.log("📱 QR CODE DISPONÍVEL:");
      console.log(`🌐 Acesse pelo navegador em: http://localhost:${PORT}/qr`);
      console.log("======================================================\n");

      qrcodeTerminal.generate(qr, { small: true });
    }

    if (connection === "close") {
      isConnected = false;
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(
        `⚠️ Conexão encerrada (Status: ${statusCode}). Reconectando: ${shouldReconnect}...`
      );

      if (shouldReconnect) {
        setTimeout(startBaileysBot, 3000);
      } else {
        console.log(
          "❌ Sessão encerrada no WhatsApp. Limpando credenciais do Neon..."
        );
        await clearSessionInNeon();
        currentQrCode = null;
      }
    } else if (connection === "open") {
      isConnected = true;
      currentQrCode = null;

      // Garante que o estado final conectado está salvo no Neon
      await backupSessionToNeon(AUTH_FOLDER);

      console.log("\n======================================================");
      console.log("✅ [WHATSAPP CONECTADO COM SUCESSO!]");
      console.log("📱 O WhatsApp continua 100% ativo no seu celular.");
      console.log("💾 A sessão foi salva no Neon Postgres (persistente).");
      console.log("📊 Gastos e receitas registrados serão salvos no Neon!");
      console.log(
        `🔒 Números autorizados: ${process.env.WHATSAPP_ALLOWED_NUMBERS || "Nenhum configurado"}`
      );
      console.log("======================================================\n");
    }
  });

  // Intercepta mensagens recebidas em tempo real
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const remoteJid = msg.key.remoteJid;
      if (
        !remoteJid ||
        remoteJid.includes("@g.us") ||
        remoteJid.includes("@broadcast")
      ) {
        continue;
      }

      const senderNumber = remoteJid.replace(/@.*$/, "");
      const allowedEnv = process.env.WHATSAPP_ALLOWED_NUMBERS;

      if (!isNumberAuthorized(senderNumber, allowedEnv)) {
        console.warn(
          `[WHATSAPP_BLOQUEIO] Mensagem de número não autorizado: ${senderNumber}. Ignorando.`
        );
        continue;
      }

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        "";

      const cleanText = text.trim();
      if (!cleanText) {
        await sock.sendMessage(remoteJid, {
          text: "Olá! No momento consigo processar apenas mensagens de texto com seus gastos ou receitas. Exemplo: *35 reais no almoço com VR* 📝",
        });
        continue;
      }

      console.log(
        `\n📩 [NOVA MENSAGEM] Remetente: ${senderNumber} | Texto: "${cleanText}"`
      );

      try {
        const result = await processFinancialMessage(senderNumber, cleanText);

        console.log(
          `🤖 [RESPOSTA IA] ${result.parsed.intent} | Resposta: "${result.replyMessage}"`
        );

        await sock.sendMessage(remoteJid, {
          text: result.replyMessage,
        });

        console.log(`✅ [ENVIADO COM SUCESSO] para ${senderNumber}!`);
      } catch (error) {
        console.error("❌ [ERRO AO PROCESSAR MENSAGEM]", error);

        await sock.sendMessage(remoteJid, {
          text: "Tive uma pequena oscilação temporária ao processar seu lançamento. Por favor, tente enviar novamente em alguns segundos! ⚠️",
        });
      }
    }
  });
}

// Inicia servidor web e bot
startWebServer();
startBaileysBot().catch((err) => {
  console.error("❌ Falha crítica ao iniciar o bot Baileys:", err);
});
