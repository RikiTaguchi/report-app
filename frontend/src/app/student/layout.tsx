import type { Metadata } from "next";
import StudentClientLayout from "./StudentClientLayout";

export const metadata: Metadata = {
  title: "レポートApp 生徒",
  description: "明光義塾レポート管理システム",

  manifest: "/student/manifest",

  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "レポートApp 生徒",
  },
};

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <StudentClientLayout>{children}</StudentClientLayout>
    </>
  );
}
