"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { getRememberedLogin, setRememberedLogin } from "@/lib/rememberLogin";
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
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const saved = getRememberedLogin(role);
    if (saved.username || saved.password) {
      setUsername(saved.username);
      setPassword(saved.password);
      setRemember(true);
    }
  }, [role]);

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
      if (remember) {
        setRememberedLogin(role, { username: username.trim(), password });
      } else {
        setRememberedLogin(role, null);
      }
      router.replace(HOME_BY_ROLE[me.role]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ログインに失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  function handleRememberChange(checked: boolean) {
    setRemember(checked);
    if (!checked) {
      setRememberedLogin(role, null);
    }
  }

  if (loading || user) {
    return <div className="spinner-page">読み込み中...</div>;
  }

  const rememberField = (
    <label className={role === "ADMIN" ? "remember-login" : "ig-login-remember"}>
      <input
        type="checkbox"
        checked={remember}
        onChange={(e) => handleRememberChange(e.target.checked)}
      />
      ログイン情報を保存
    </label>
  );

  if (role === "ADMIN") {
    return (
      <div className="login-page admin-login">
        <div className="card login-card">
          <h1 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 18 }}>
            日報管理システム {ROLE_LABEL[role]}ログイン
          </h1>
          <form className="stack" onSubmit={handleSubmit} autoComplete="on">
            <div className="field">
              <label className="label" htmlFor="username">ユーザー名</label>
              <input
                id="username"
                name="username"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="password">パスワード</label>
              <input
                id="password"
                name="password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {rememberField}
            {error && <div className="alert alert-error">{error}</div>}
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "ログイン中..." : "ログイン"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const canSubmit = username.trim().length > 0 && password.length > 0 && !submitting;

  return (
    <div className="ig-login-page">
      <div className="ig-login-card">
        <h1 className="ig-login-logo">Instagram</h1>
        <p className="ig-login-subtitle">{ROLE_LABEL[role]}のアカウントでログイン</p>
        <form className="ig-login-form" onSubmit={handleSubmit} autoComplete="on">
          <label className="ig-login-field">
            <span className="sr-only">ユーザー名</span>
            <input
              id="username"
              name="username"
              className="ig-login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="ユーザー名"
              required
            />
          </label>
          <label className="ig-login-field">
            <span className="sr-only">パスワード</span>
            <input
              id="password"
              name="password"
              type="password"
              className="ig-login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="パスワード"
              required
            />
          </label>
          {rememberField}
          {error && <p className="ig-login-error" role="alert">{error}</p>}
          <button type="submit" className="ig-login-submit" disabled={!canSubmit}>
            {submitting ? "ログイン中..." : "ログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}
