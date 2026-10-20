import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Casal Avalanche • Gestão Financeira Inteligente",
  description:
    "Gestão Financeira para Casal com Pote Único, Carteiras Separadas (Livre vs Benefícios VR/VA) e foco em quitação acelerada de empréstimos pelo Método Avalanche.",
  applicationName: "Casal Avalanche",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Casal Avalanche",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#090d16",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
