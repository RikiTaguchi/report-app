"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import type { Role } from "@/lib/types";

const HOME_BY_ROLE: Record<Role, string> = {
  ADMIN: "/admin",
  TEACHER: "/teacher",
  STUDENT: "/student",
};

const ROLE_LABEL: Record<Role, string> = {
  STUDENT: "生徒",
  TEACHER: "講師",
  ADMIN: "管理者",
};

export function LoginForm({ role }: { role: Role }) {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(HOME_BY_ROLE[user.role]);
    }
  }, [loading, user, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const me = await login(role, { username, password });
      router.replace(HOME_BY_ROLE[me.role]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ログインに失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || user) {
    return <div className="spinner-page">読み込み中...</div>;
  }

  return (
    <div className="login-page">
      <div className="card login-card">
        <h1 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 18 }}>
          日報管理システム {ROLE_LABEL[role]}ログイン
        </h1>

        <form className="stack" onSubmit={handleSubmit}>
          <div className="field">
            <label className="label" htmlFor="username">
              ユーザー名
            </label>
            <input
              id="username"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="password">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "ログイン中..." : "ログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}
