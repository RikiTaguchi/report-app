"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminApi, ApiError } from "@/lib/api";
import type { TeacherCreateRequest } from "@/lib/types";

export default function NewTeacherPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const req: TeacherCreateRequest = { username, password, lastName, firstName };
      await adminApi.createTeacher(req);
      router.push("/admin/teachers?msg=created");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>講師を新規登録</h1>
        <Link href="/admin/teachers" className="btn btn-ghost btn-sm">
          戻る
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit} className="stack">
          <div className="field">
            <label className="label">
              ユーザー名 <span className="required-badge">必須入力</span>
            </label>
            <input
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="label">
              パスワード <span className="required-badge">必須入力</span>
            </label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="label">
              姓 <span className="required-badge">必須入力</span>
            </label>
            <input
              type="text"
              className="input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="label">
              名 <span className="required-badge">必須入力</span>
            </label>
            <input
              type="text"
              className="input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "作成中..." : "作成する"}
          </button>
        </form>
      </div>
    </div>
  );
}
