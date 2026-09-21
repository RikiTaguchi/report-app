import type { Metadata, Viewport } from "next";
import "./globals.css";
// ↓追加：AuthContextからAuthProviderをインポート
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "レポートApp",
  description: "明光義塾レポート管理システム",
};

export const viewport: Viewport = {
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
    <html lang="ja">
      <body>
        {/* ↓追加：children を AuthProvider で包む */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
