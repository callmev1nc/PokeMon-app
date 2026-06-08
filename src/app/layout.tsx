import type { Metadata } from "next";
import { Bebas_Neue, Outfit } from "next/font/google";
import ThemeSync from "@/components/ThemeSync";
import NotificationToast from "@/components/NotificationToast";
import Footer from "@/components/Footer";
import "./globals.css";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Pokémon Card Store | Thẻ Bài Pokémon",
    template: "%s | V1ncc TCG Card Shop",
  },
  description:
    "Cửa hàng bán thẻ Pokémon card online - Normal, Holo, Prize Card, EX. Chất lượng, giá tốt, giao hàng toàn quốc.",
  keywords: [
    "Pokemon",
    "TCG",
    "thẻ bài",
    "Pokemon card",
    "V1ncc",
    "hàng chính hãng",
  ],
  manifest: "/manifest.json",
  openGraph: {
    title: "V1ncc TCG Card Shop",
    description:
      "Thẻ bài Pokémon chất lượng cao - Normal, Holo, Prize Card, EX",
    siteName: "V1ncc TCG Card Shop",
    type: "website",
    locale: "vi_VN",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${bebas.variable} ${outfit.variable}`}>
      <head>
        <link rel="preconnect" href="https://assets.tcgdex.net" />
        <link rel="dns-prefetch" href="https://assets.tcgdex.net" />
        <link rel="dns-prefetch" href="https://images.pokemontcg.io" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#050816" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#F8F6F1" media="(prefers-color-scheme: light)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-[#FAFAFA] dark:bg-[#0F1629] antialiased flex flex-col">
        <NotificationToast>
          <ThemeSync />
          {children}
        </NotificationToast>
        <Footer />
      </body>
    </html>
  );
}
