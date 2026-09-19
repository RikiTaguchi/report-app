"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AppHeader, type NavItem } from "@/components/AppHeader";
import { HomeIcon, UsersIcon, DocumentIcon, GearIcon } from "@/components/icons";
import { ToastProvider } from "@/components/Toast";

const ITEMS: NavItem[] = [
  { href: "/admin", label: "ダッシュボード", icon: HomeIcon, exact: true },
  {
    href: "/admin/teachers",
    label: "講師管理",
    icon: UsersIcon,
    submenu: [
      { href: "/admin/teachers", label: "講師情報" },
      { href: "/admin/blogs", label: "講師ブログ" },
    ],
  },
  {
    href: "/admin/students",
    label: "生徒管理",
    icon: DocumentIcon,
    submenu: [
      { href: "/admin/students", label: "生徒情報" },
      { href: "/admin/reports", label: "生徒日報" },
    ],
  },
  { href: "/admin/settings", label: "設定", icon: GearIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "ADMIN") {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user || user.role !== "ADMIN") {
    return <div className="spinner-page">読み込み中...</div>;
  }

  return (
    <ToastProvider>
      <AppHeader brand="日報システム（管理者）" items={ITEMS} userLabel={user.name} />
      <div className="app-body">{children}</div>
    </ToastProvider>
  );
}
