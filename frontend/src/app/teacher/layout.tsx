import type { Metadata } from "next";
import TeacherClientLayout from "./TeacherClientLayout";

export const metadata: Metadata = {
  title: "レポートApp 講師",
  description: "明光義塾レポート管理システム",

  manifest: "/teacher/manifest.webmanifest",

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "レポートApp 講師",
  },
};

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TeacherClientLayout>{children}</TeacherClientLayout>;
}
