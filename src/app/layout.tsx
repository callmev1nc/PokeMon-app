import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pokemon Card Store | The Bai Pokemon",
  description: "Cua hang ban the Pokemon card online - Chat luong, gia tot",
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
