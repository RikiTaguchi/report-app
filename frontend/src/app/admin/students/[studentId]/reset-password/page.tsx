"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, ApiError } from "@/lib/api";
import type { StudentResponse, PasswordResetRequest } from "@/lib/types";

export default function ResetStudentPasswordPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const [studentId, setStudentId] = useState<string>("");
  const [student, setStudent] = useState<StudentResponse | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const resolvedParams = await params;
      setStudentId(resolvedParams.studentId);
    })();
  }, [params]);

  useEffect(() => {
    if (!studentId) return;
    (async () => {
      try {
        const s = await adminApi.getStudent(studentId);
        setStudent(s);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const req: PasswordResetRequest = { newPassword };
      await adminApi.resetStudentPassword(studentId, req);
      setDone(newPassword);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="page spinner-page">読み込み中...</div>;
  }

  if (!student) {
    return (
      <div className="page">
        <div className="alert alert-error">{error || "生徒が見つかりません"}</div>
        <Link href="/admin/students" className="btn btn-ghost">
          戻る
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>パスワード再設定</h1>
        </div>
        <div className="card">
          <div className="alert alert-success">
            {student.name} さんのパスワードを再設定しました
          </div>
          <div className="field" style={{ marginTop: "14px" }}>
            <label className="label">新しいパスワード</label>
            <input type="text" className="input" value={done} readOnly />
          </div>
          <Link href={`/admin/students/${studentId}`} className="btn btn-primary btn-block" style={{ marginTop: "14px" }}>
            生徒詳細へ戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>パスワード再設定</h1>
        <Link href={`/admin/students/${studentId}`} className="btn btn-ghost btn-sm">
          戻る
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="muted" style={{ fontSize: "0.85rem", marginBottom: "12px" }}>
          対象: {student.name}（{student.username}）
        </div>
        <form onSubmit={handleSubmit} className="stack">
          <div className="field">
            <label className="label">
              新しいパスワード <span className="required-badge">必須入力</span>
            </label>
            <input
              type="text"
              className="input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="label">
              新しいパスワード（確認） <span className="required-badge">必須入力</span>
            </label>
            <input
              type="text"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "設定中..." : "再設定する"}
          </button>
        </form>
      </div>
    </div>
  );
}
