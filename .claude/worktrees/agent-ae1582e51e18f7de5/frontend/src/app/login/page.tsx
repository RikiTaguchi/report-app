"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/lib/types";

const HOME_BY_ROLE: Record<Role, string> = {
  ADMIN: "/admin",
  TEACHER: "/teacher",
  STUDENT: "/student",
};

const ROLE_OPTIONS: { role: Role; label: string; href: string }[] = [
  { role: "STUDENT", label: "生徒としてログイン", href: "/login/student" },
  { role: "TEACHER", label: "講師としてログイン", href: "/login/teacher" },
  { role: "ADMIN", label: "管理者としてログイン", href: "/login/admin" },
];

export default function LoginSelectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(HOME_BY_ROLE[user.role]);
    }
  }, [loading, user, router]);

  if (loading || user) {
    return <div className="spinner-page">読み込み中...</div>;
  }

  return (
    <div className="login-page">
      <div className="card login-card">
        <h1 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 18 }}>
          日報管理システム ログイン
        </h1>

        <div className="stack">
          {ROLE_OPTIONS.map((option) => (
            <Link key={option.role} href={option.href} className="btn btn-primary">
              {option.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
