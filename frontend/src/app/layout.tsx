import type { Metadata } from "next";
import "./globals.css";

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
      {/* classNameからフォントの変数を削除し、シンプルなbodyにしています */}
      <body>
        {children}
      </body>
    </html>
  );
}
