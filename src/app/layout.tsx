import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pokémon Card Store | Thẻ Bài Pokémon",
  description: "Cửa hàng bán thẻ Pokémon card online - Chất lượng, giá tốt",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-surface-alt antialiased">{children}</body>
    </html>
  );
}
