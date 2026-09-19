"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminApi, ApiError } from "@/lib/api";
import type { StudentResponse, TeacherResponse, StudentUpdateRequest } from "@/lib/types";

export default function EditStudentPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const router = useRouter();
  const [studentId, setStudentId] = useState<string>("");
  const [student, setStudent] = useState<StudentResponse | null>(null);
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        const [s, t] = await Promise.all([
          adminApi.getStudent(studentId),
          adminApi.listTeachers(),
        ]);
        setStudent(s);
        setTeachers(t);
        setLastName(s.lastName);
        setFirstName(s.firstName);
        setTeacherId(s.teacherId);
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
    if (!teacherId) {
      setError("講師を選択してください");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const req: StudentUpdateRequest = { lastName, firstName, teacherId };
      await adminApi.updateStudent(studentId, req);
      router.push("/admin/students?msg=updated");
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

  return (
    <div className="page">
      <div className="page-header">
        <h1>生徒情報を編集</h1>
        <Link href="/admin/students" className="btn btn-ghost btn-sm">
          戻る
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="muted" style={{ fontSize: "0.85rem", marginBottom: "12px" }}>
          ユーザー名: {student.username}
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
            {submitting ? "更新中..." : "更新する"}
          </button>
        </form>
      </div>
    </div>
  );
}
