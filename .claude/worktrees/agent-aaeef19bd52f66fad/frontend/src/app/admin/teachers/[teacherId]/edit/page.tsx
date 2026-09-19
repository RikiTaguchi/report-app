"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminApi, ApiError } from "@/lib/api";
import type { TeacherResponse, TeacherUpdateRequest } from "@/lib/types";

export default function EditTeacherPage({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}) {
  const router = useRouter();
  const [teacherId, setTeacherId] = useState<string>("");
  const [teacher, setTeacher] = useState<TeacherResponse | null>(null);
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setLastName(t.lastName);
        setFirstName(t.firstName);
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
    setSubmitting(true);
    setError(null);
    try {
      const req: TeacherUpdateRequest = { lastName, firstName };
      await adminApi.updateTeacher(teacherId, req);
      router.push("/admin/teachers?msg=updated");
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

  return (
    <div className="page">
      <div className="page-header">
        <h1>講師情報を編集</h1>
        <Link href="/admin/teachers" className="btn btn-ghost btn-sm">
          戻る
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="muted" style={{ fontSize: "0.85rem", marginBottom: "12px" }}>
          ユーザー名: {teacher.username}
        </div>
        <form onSubmit={handleSubmit} className="stack">
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
            {submitting ? "更新中..." : "更新する"}
          </button>
        </form>
      </div>
    </div>
  );
}
