"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminApi, ApiError } from "@/lib/api";
import type { TeacherResponse, StudentCreateRequest } from "@/lib/types";

export default function NewStudentPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const t = await adminApi.listTeachers();
        setTeachers(t);
        if (t.length > 0) setTeacherId(t[0].id);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teacherId) {
      setError("講師を選択してください");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const req: StudentCreateRequest = { username, password, lastName, firstName, teacherId };
      await adminApi.createStudent(req);
      router.push("/admin/students?msg=created");
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

  return (
    <div className="page">
      <div className="page-header">
        <h1>生徒を新規登録</h1>
        <Link href="/admin/students" className="btn btn-ghost btn-sm">
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
          <div className="field">
            <label className="label">
              担当講師 <span className="required-badge">必須入力</span>
            </label>
            {teachers.length === 0 ? (
              <div className="muted" style={{ fontSize: "0.85rem" }}>
                講師が登録されていません
              </div>
            ) : (
              <div className="chip-group">
                {teachers.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`chip ${teacherId === t.id ? "active" : ""}`}
                    onClick={() => setTeacherId(t.id)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "作成中..." : "作成する"}
          </button>
        </form>
      </div>
    </div>
  );
}
