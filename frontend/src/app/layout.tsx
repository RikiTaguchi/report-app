import type { Metadata } from "next";
import "./globals.css";
// ↓追加：AuthContextからAuthProviderをインポート
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Report App",
  description: "Report Application",
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
