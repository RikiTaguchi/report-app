import type { Metadata } from "next";
import StudentClientLayout from "./StudentClientLayout";

export const metadata: Metadata = {
  title: "レポートApp 生徒",
  description: "明光義塾レポート管理システム",

  manifest: "/student/manifest.webmanifest",

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
  return <StudentClientLayout>{children}</StudentClientLayout>;
}
