"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AppHeader, type NavItem } from "@/components/AppHeader";
import { HomeIcon, DocumentIcon, ChatIcon, GearIcon } from "@/components/icons";
import { ToastProvider } from "@/components/Toast";

const ITEMS: NavItem[] = [
  { href: "/student", label: "ホーム", icon: HomeIcon, exact: true },
  { href: "/student/reports", label: "レポート管理", icon: DocumentIcon },
  { href: "/student/blogs", label: "講師ブログ", icon: ChatIcon },
  { href: "/student/settings", label: "設定", icon: GearIcon },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "STUDENT") {
      router.replace("/login/student");
    }
  }, [loading, user, router]);

  if (loading || !user || user.role !== "STUDENT") {
    return <div className="spinner-page">読み込み中...</div>;
  }

  return (
    <div className="ig-force-mobile">
      <ToastProvider>
        <AppHeader brand="Instagram" items={ITEMS} userLabel={`${user.name} さん`} logoutHref="/login/student" />
        <div className="app-body">{children}</div>
      </ToastProvider>
    </div>
  );
}
