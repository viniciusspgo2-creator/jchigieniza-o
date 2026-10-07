import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SITE_URL } from "@/lib/constants";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "JC Lavagem a Seco | Higienização de estofados em Goiânia",
    template: "%s | JC Lavagem a Seco",
  },
  description:
    "Higienização a domicílio de sofás, colchões, cadeiras, carrinhos de bebê e bancos de carro em Goiânia. Peça seu orçamento pelo WhatsApp (62) 99157-9369.",
  icons: {
    icon: "/favicon.png",
    apple: "/img/brand/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "JC Lavagem a Seco",
    images: [{ url: "/img/brand/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/img/brand/og-image.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0A2347",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${jakarta.variable} ${inter.variable} antialiased bg-background text-foreground`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
