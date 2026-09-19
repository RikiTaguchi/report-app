"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AppHeader, type NavItem } from "@/components/AppHeader";
import { HomeIcon, UsersIcon, ChatIcon, GearIcon } from "@/components/icons";
import { ToastProvider } from "@/components/Toast";

const ITEMS: NavItem[] = [
  { href: "/teacher", label: "ダッシュボード", icon: HomeIcon, exact: true },
  {
    href: "/teacher/students",
    label: "生徒管理",
    icon: UsersIcon,
    submenu: [
      { href: "/teacher/students", label: "生徒情報" },
      { href: "/teacher/reports", label: "生徒日報" },
    ],
  },
  { href: "/teacher/blogs", label: "講師ブログ", icon: ChatIcon },
  { href: "/teacher/settings", label: "設定", icon: GearIcon },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "TEACHER") {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user || user.role !== "TEACHER") {
    return <div className="spinner-page">読み込み中...</div>;
  }

  return (
    <ToastProvider>
      <AppHeader brand="日報システム（講師）" items={ITEMS} userLabel={`${user.name} 先生`} />
      <div className="app-body">{children}</div>
    </ToastProvider>
  );
}
