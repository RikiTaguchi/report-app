"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { adminApi, ApiError } from "@/lib/api";
import type { StudentDashboardResponse, StudentResponse } from "@/lib/types";

const MSG_LABEL: Record<string, string> = {
  created: "生徒を作成しました",
  updated: "生徒情報を更新しました",
  reset: "パスワードを再設定しました",
};

function AdminStudentsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialStudentId = searchParams.get("studentId") ?? undefined;

  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [dashboard, setDashboard] = useState<StudentDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await adminApi.listStudents();
        setStudents(data);
        if (initialStudentId && data.some((s) => s.id === initialStudentId)) {
          setSelectedStudentId(initialStudentId);
        } else if (data.length > 0) {
          setSelectedStudentId(data[0].id);
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [initialStudentId]);

  useEffect(() => {
    const msg = searchParams.get("msg");
    if (msg && MSG_LABEL[msg]) {
      setSuccessMsg(MSG_LABEL[msg]);
      router.replace(pathname);
    }
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (!selectedStudentId) return;
    adminApi
      .getStudentDashboard(selectedStudentId)
      .then(setDashboard)
      .catch(() => setDashboard(null));
  }, [selectedStudentId]);

  async function handleDelete() {
    if (!selectedStudentId) return;
    if (!window.confirm("この生徒を削除してもよろしいですか?関連する目標・日報等も削除されます。")) return;
    try {
      await adminApi.deleteStudent(selectedStudentId);
      const remaining = students.filter((s) => s.id !== selectedStudentId);
      setStudents(remaining);
      setSelectedStudentId(remaining.length > 0 ? remaining[0].id : "");
      setSuccessMsg("生徒を削除しました");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    }
  }

  if (loading) {
    return <div className="page spinner-page">読み込み中...</div>;
  }

  const student = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="page">
      <div className="page-header">
        <h1>生徒情報</h1>
        <Link href="/admin/students/new" className="btn btn-primary">
          新規登録
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="card">
        <div className="field">
          <label className="label">生徒を選択</label>
          <select
            className="select"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {student && (
          <div className="stack-sm" style={{ marginTop: "12px" }}>
            <div>
              <span className="label">氏名: </span>
              {student.name}
            </div>
            <div>
              <span className="label">ユーザー名: </span>
              {student.username}
            </div>
            <div>
              <span className="label">担当講師: </span>
              {student.teacherName || "未割り当て"}
            </div>
            <div>
              <span className="label">作成日時: </span>
              {new Date(student.createdAt).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
            </div>
          </div>
        )}

        {student && (
          <div className="row" style={{ marginTop: "14px" }}>
            <Link className="btn btn-sm btn-ghost" href={`/admin/students/${student.id}/edit`}>
              編集
            </Link>
            <Link className="btn btn-sm btn-ghost" href={`/admin/students/${student.id}/reset-password`}>
              パスワード再設定
            </Link>
            <button className="btn btn-sm btn-danger" onClick={handleDelete}>
              生徒を削除
            </button>
          </div>
        )}
      </div>

      {student && (
        <div className="card">
          <div className="section-title">連続提出日数</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 600, marginTop: "6px" }}>
            {dashboard?.consecutiveSubmissionDays ?? 0} 日
          </div>
        </div>
      )}

      {student && (
        <div className="card">
          <div className="row-between">
            <div className="section-title">目標・日報項目</div>
            <div className="row">
              <Link className="btn btn-sm btn-ghost" href={`/admin/goals?studentId=${student.id}`}>
                目標を管理
              </Link>
              <Link className="btn btn-sm btn-ghost" href={`/admin/report-items?studentId=${student.id}`}>
                日報項目を管理
              </Link>
            </div>
          </div>
          {dashboard && dashboard.goals.length === 0 && (
            <div className="empty-state">目標がありません</div>
          )}
          {dashboard && dashboard.goals.length > 0 && (
            <div className="stack" style={{ marginTop: "10px" }}>
              {dashboard.goals
                .filter((g) => g.isCurrent)
                .map((goal) => (
                  <div key={goal.id} className="stack-sm">
                    <div className="row" style={{ gap: 8, alignItems: "center" }}>
                      <div style={{ fontWeight: 600 }}>{goal.title}</div>
                      <span className="badge badge-success">現在</span>
                    </div>
                    {goal.latestProgress && (
                      <div className="progress-bar">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${goal.latestProgress.progressPercent}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {students.length === 0 && <div className="empty-state">生徒がいません</div>}
    </div>
  );
}

export default function AdminStudentsPage() {
  return (
    <Suspense fallback={<div className="page spinner-page">読み込み中...</div>}>
      <AdminStudentsContent />
    </Suspense>
  );
}
