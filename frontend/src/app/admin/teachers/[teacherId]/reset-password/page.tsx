"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, ApiError } from "@/lib/api";
import type { TeacherResponse, PasswordResetRequest } from "@/lib/types";

export default function ResetTeacherPasswordPage({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}) {
  const [teacherId, setTeacherId] = useState<string>("");
  const [teacher, setTeacher] = useState<TeacherResponse | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const resolvedParams = await params;
      setTeacherId(resolvedParams.teacherId);
    })();
  }, [params]);

  useEffect(() => {
    if (!teacherId) return;
    (async () => {
      try {
        const t = await adminApi.getTeacher(teacherId);
        setTeacher(t);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [teacherId]);

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
      await adminApi.resetTeacherPassword(teacherId, req);
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

  if (!teacher) {
    return (
      <div className="page">
        <div className="alert alert-error">{error || "講師が見つかりません"}</div>
        <Link href="/admin/teachers" className="btn btn-ghost">
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
            {teacher.name} さんのパスワードを再設定しました
          </div>
          <div className="field" style={{ marginTop: "14px" }}>
            <label className="label">新しいパスワード</label>
            <input type="text" className="input" value={done} readOnly />
          </div>
          <Link href={`/admin/teachers/${teacherId}`} className="btn btn-primary btn-block" style={{ marginTop: "14px" }}>
            講師詳細へ戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>パスワード再設定</h1>
        <Link href={`/admin/teachers/${teacherId}`} className="btn btn-ghost btn-sm">
          戻る
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="muted" style={{ fontSize: "0.85rem", marginBottom: "12px" }}>
          対象: {teacher.name}（{teacher.username}）
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
