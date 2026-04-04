import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "PharmaControl",
    template: "%s | PharmaControl",
  },
  description:
    "Sistema de Controle de Estoque e Recompras para Farmacias de Manipulacao",
  applicationName: "PharmaControl",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
