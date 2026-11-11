import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const statusRecord = await prisma.whatsAppSession.findUnique({
      where: { id: "qr_status" },
    });

    if (!statusRecord) {
      return NextResponse.json({
        connected: false,
        qr: null,
        qrDataUrl: null,
        updatedAt: null,
        status: "waiting_service",
      });
    }

    const parsed = JSON.parse(statusRecord.data);
    let qrDataUrl: string | null = null;

    if (parsed.qr && !parsed.connected) {
      qrDataUrl = await QRCode.toDataURL(parsed.qr, {
        width: 320,
        margin: 2,
        color: { dark: "#2D2824", light: "#FFFFFF" },
      });
    }

    return NextResponse.json({
      connected: !!parsed.connected,
      qr: parsed.qr || null,
      qrDataUrl,
      updatedAt: parsed.updatedAt || statusRecord.updatedAt.toISOString(),
      status: parsed.connected ? "connected" : parsed.qr ? "needs_scan" : "disconnected",
    });
  } catch (error) {
    console.error("[WHATSAPP_STATUS_API_ERROR]", error);
    return NextResponse.json(
      {
        connected: false,
        qr: null,
        qrDataUrl: null,
        status: "error",
      },
      { status: 500 }
    );
  }
}

