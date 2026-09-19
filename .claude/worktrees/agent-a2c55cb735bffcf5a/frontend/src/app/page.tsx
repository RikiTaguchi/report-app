"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const HOME_BY_ROLE: Record<string, string> = {
  ADMIN: "/admin",
  TEACHER: "/teacher",
  STUDENT: "/student",
};

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? HOME_BY_ROLE[user.role] : "/login");
  }, [loading, user, router]);

  return <div className="spinner-page">読み込み中...</div>;
}
