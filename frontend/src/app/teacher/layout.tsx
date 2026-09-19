"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AppHeader, type NavItem } from "@/components/AppHeader";
import { HomeIcon, UsersIcon, ChatIcon, GearIcon } from "@/components/icons";
import { ToastProvider } from "@/components/Toast";

const ITEMS: NavItem[] = [
  { href: "/teacher", label: "ホーム", icon: HomeIcon, exact: true },
  { href: "/teacher/students", label: "生徒", icon: UsersIcon },
  { href: "/teacher/blogs", label: "ブログ", icon: ChatIcon, alsoMatch: ["/teacher/teachers"] },
  { href: "/teacher/settings", label: "設定", icon: GearIcon },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "TEACHER") {
      router.replace("/login/teacher");
    }
  }, [loading, user, router]);

  if (loading || !user || user.role !== "TEACHER") {
    return <div className="spinner-page">読み込み中...</div>;
  }

  return (
    <div className="ig-force-mobile">
      <ToastProvider>
        <AppHeader brand="Instagram" items={ITEMS} userLabel={`${user.name} 先生`} logoutHref="/login/teacher" />
        <div className="app-body">{children}</div>
      </ToastProvider>
    </div>
  );
}
