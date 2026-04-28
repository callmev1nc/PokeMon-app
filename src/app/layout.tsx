import type { Metadata } from "next";
import { Bebas_Neue, Outfit } from "next/font/google";
import ThemeSync from "@/components/ThemeSync";
import "./globals.css";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin", "vietnamese"],
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
      <body className="min-h-screen bg-surface-alt antialiased">
        <ThemeSync />
        {children}
      </body>
    </html>
  );
}
