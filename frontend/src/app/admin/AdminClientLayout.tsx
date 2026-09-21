"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AppHeader, type NavItem } from "@/components/AppHeader";
import { HomeIcon, UsersIcon, DocumentIcon } from "@/components/icons";
import { ToastProvider } from "@/components/Toast";

const ITEMS: NavItem[] = [
  { href: "/admin", label: "ホーム", icon: HomeIcon, exact: true },
  { href: "/admin/teachers", label: "講師管理", icon: UsersIcon },
  { href: "/admin/students", label: "生徒管理", icon: DocumentIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "ADMIN") {
      router.replace("/login/admin");
    }
  }, [loading, user, router]);

  if (loading || !user || user.role !== "ADMIN") {
    return (
      <div className="admin-app">
        <div className="spinner-page">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="admin-app">
      <ToastProvider>
        <AppHeader brand="管理者コンソール" items={ITEMS} userLabel={user.name} logoutHref="/admin/login" />
        <div className="app-body">{children}</div>
      </ToastProvider>
    </div>
  );
}
