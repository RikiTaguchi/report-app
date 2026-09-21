"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AppHeader, type NavItem } from "@/components/AppHeader";
import { HomeIcon, UsersIcon, DocumentIcon } from "@/components/icons";
import { ToastProvider } from "@/components/Toast";

const ITEMS: NavItem[] = [
  { href: "/admin", label: "ホーム", icon: HomeIcon, exact: true },
  { href: "/admin/teachers", label: "講師管理", icon: UsersIcon },
  { href: "/admin/students", label: "生徒管理", icon: DocumentIcon },
];

export default function AdminClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    // ログイン画面では認証チェックをしない
    if (isLoginPage || loading) return;

    if (!user || user.role !== "ADMIN") {
      router.replace("/admin/login");
    }
  }, [isLoginPage, loading, user, router]);

  // ログイン画面はそのまま表示
  if (isLoginPage) {
    return <>{children}</>;
  }

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
        <AppHeader
          brand="管理者コンソール"
          items={ITEMS}
          userLabel={user.name}
          logoutHref="/admin/login"
        />
        <div className="app-body">{children}</div>
      </ToastProvider>
    </div>
  );
}
