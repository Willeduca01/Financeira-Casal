import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Casal Avalanche • Gestão Financeira Natural & Aconchegante",
  description:
    "Gestão Financeira para Casal com Pote Único, Carteiras Separadas (Livre vs Benefícios VR/VA) e foco em quitação acelerada de empréstimos pelo Método Avalanche.",
  applicationName: "Casal Avalanche",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Casal Avalanche",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#C46D53",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { AuthProvider } from "@/components/providers/AuthProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${plusJakartaSans.variable} ${fraunces.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen bg-[#F4EFE6] text-[#2C221E] antialiased font-sans selection:bg-[#C46D53]/20 selection:text-[#2C221E]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
