"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminApi, ApiError } from "@/lib/api";
import { Avatar } from "@/components/Avatar";
import type {
  DailyReportListItemResponse,
  GoalProgressCreateRequest,
  GoalProgressResponse,
  GoalResponse,
  StudentResponse,
} from "@/lib/types";

export default function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [student, setStudent] = useState<StudentResponse | null>(null);
  const [goals, setGoals] = useState<GoalResponse[]>([]);
  const [progresses, setProgresses] = useState<Record<string, GoalProgressResponse[]>>({});
  const [reports, setReports] = useState<DailyReportListItemResponse[]>([]);
  const [progressDraft, setProgressDraft] = useState<Record<string, GoalProgressCreateRequest>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    params.then((value) => setStudentId(value.studentId));
  }, [params]);

  async function load(id: string) {
    const [studentData, goalList, reportList] = await Promise.all([
      adminApi.getStudent(id),
      adminApi.goals.list(id),
      adminApi.listReports(id),
    ]);
    setStudent(studentData);
    setGoals(goalList);
    setReports(reportList.sort((a, b) => b.reportDate.localeCompare(a.reportDate)));
    const progressEntries = await Promise.all(
      goalList.map(async (goal) => [goal.id, await adminApi.goals.listProgresses(id, goal.id)] as const)
    );
    setProgresses(Object.fromEntries(progressEntries));
  }

  useEffect(() => {
    if (!studentId) return;
    load(studentId)
      .catch((err) => setError(err instanceof ApiError ? err.message : "生徒情報の読み込みに失敗しました"))
      .finally(() => setLoading(false));
  }, [studentId]);

  async function handleDeleteStudent() {
    if (!window.confirm("この生徒を削除しますか？目標・日報なども削除されます。")) return;
    try {
      await adminApi.deleteStudent(studentId);
      router.push("/admin/students?msg=deleted");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "生徒の削除に失敗しました");
    }
  }

  async function handleDeleteGoal(goalId: string) {
    if (!window.confirm("この目標を削除しますか？")) return;
    try {
      setError(null);
      await adminApi.goals.remove(studentId, goalId);
      setMessage("目標を削除しました");
      await load(studentId);
    } catch (err) {
      setMessage(null);
      setError(err instanceof ApiError ? err.message : "目標の削除に失敗しました");
    }
  }

  async function handleAddProgress(goalId: string) {
    const draft = progressDraft[goalId];
    if (!draft?.recordedDate) {
      setMessage(null);
      setError("進捗の記録日を入力してください");
      return;
    }
    try {
      setError(null);
      await adminApi.goals.createProgress(studentId, goalId, {
        progressPercent: Number(draft.progressPercent) || 0,
        comment: draft.comment || null,
        recordedDate: draft.recordedDate,
      });
      setProgressDraft((prev) => ({ ...prev, [goalId]: { progressPercent: 0, comment: "", recordedDate: "" } }));
      setMessage("進捗を追加しました");
      await load(studentId);
    } catch (err) {
      setMessage(null);
      setError(err instanceof ApiError ? err.message : "進捗の追加に失敗しました");
    }
  }

  async function handleDeleteProgress(goalId: string, progressId: string) {
    if (!window.confirm("この進捗を削除しますか？")) return;
    try {
      setError(null);
      await adminApi.goals.removeProgress(studentId, goalId, progressId);
      setMessage("進捗を削除しました");
      await load(studentId);
    } catch (err) {
      setMessage(null);
      setError(err instanceof ApiError ? err.message : "進捗の削除に失敗しました");
    }
  }

  async function handleDeleteReport(reportDate: string) {
    if (!window.confirm("この日報を削除しますか？")) return;
    try {
      setError(null);
      await adminApi.deleteReport(studentId, reportDate);
      setReports((prev) => prev.filter((report) => report.reportDate !== reportDate));
      setMessage("日報を削除しました");
    } catch (err) {
      setMessage(null);
      setError(err instanceof ApiError ? err.message : "日報の削除に失敗しました");
    }
  }

  if (loading) return <div className="page spinner-page">読み込み中...</div>;
  if (!student) {
    return (
      <div className="page">
        <div className="alert alert-error">{error || "生徒が見つかりません"}</div>
        <Link href="/admin/students" className="btn btn-ghost">戻る</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="row" style={{ gap: 12 }}>
          <Avatar
            src={student.profileImageUrl}
            name={student.name}
            photoClassName="ig-avatar-photo"
            textClassName="ig-avatar"
          />
          <h1>{student.name}</h1>
        </div>
        <Link href="/admin/students" className="btn btn-ghost btn-sm">一覧へ戻る</Link>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="card">
        <div className="stack-sm">
          <div><span className="label">ユーザー名: </span>{student.username}</div>
          <div><span className="label">担当講師: </span>{student.teacherName ?? "未設定"}</div>
        </div>
        <div className="row" style={{ marginTop: 14 }}>
          <Link className="btn btn-sm btn-ghost" href={`/admin/students/${student.id}/reset-password`}>
            パスワード再設定
          </Link>
          <button className="btn btn-sm btn-danger" onClick={() => void handleDeleteStudent()}>生徒を削除</button>
        </div>
      </div>

      <div className="card">
        <div className="row-between">
          <div className="section-title">目標・レポート項目・進捗</div>
          <Link className="btn btn-primary btn-sm" href={`/admin/students/${student.id}/goals/new`}>目標を追加</Link>
        </div>
        {goals.length === 0 ? (
          <div className="empty-state">目標はありません</div>
        ) : (
          <div className="stack" style={{ marginTop: 12 }}>
            {goals.map((goal) => {
              const draft = progressDraft[goal.id] ?? { progressPercent: 0, comment: "", recordedDate: "" };
              return (
                <div key={goal.id} className="admin-subtitle-card">
                  <div className="row-between">
                    <div>
                      <div style={{ fontWeight: 700 }}>
                        {goal.title} {goal.isCurrent && <span className="badge badge-success">現在</span>}
                      </div>
                      <div className="muted" style={{ fontSize: "0.85rem" }}>
                        {goal.startDate} 〜 {goal.endDate}
                      </div>
                      {goal.description && <div style={{ marginTop: 6 }}>{goal.description}</div>}
                      {goal.reportItemSubtitleLabels.length > 0 && (
                        <div className="muted" style={{ fontSize: "0.85rem", marginTop: 6 }}>
                          項目: {goal.reportItemSubtitleLabels.join(" / ")}
                        </div>
                      )}
                    </div>
                    <div className="row">
                      <Link className="btn btn-sm btn-ghost" href={`/admin/students/${student.id}/goals/${goal.id}/edit`}>
                        編集
                      </Link>
                      <button className="btn btn-sm btn-danger" onClick={() => void handleDeleteGoal(goal.id)}>削除</button>
                    </div>
                  </div>
                  <div>
                    <div className="label">進捗</div>
                    {(progresses[goal.id] ?? []).length === 0 ? (
                      <div className="muted" style={{ fontSize: "0.85rem" }}>進捗はまだありません</div>
                    ) : (
                      <ul className="stack-sm" style={{ marginTop: 6 }}>
                        {(progresses[goal.id] ?? []).map((progress) => (
                          <li key={progress.id} className="row-between">
                            <span>
                              {progress.recordedDate} / {progress.progressPercent}%
                              {progress.comment ? ` / ${progress.comment}` : ""}
                            </span>
                            <button className="btn btn-sm btn-ghost" onClick={() => void handleDeleteProgress(goal.id, progress.id)}>
                              削除
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="admin-form-grid" style={{ marginTop: 8 }}>
                      <div className="field">
                        <label className="label" htmlFor={`progress-date-${goal.id}`}>記録日</label>
                        <input
                          id={`progress-date-${goal.id}`}
                          className="input"
                          type="date"
                          value={draft.recordedDate}
                          onChange={(event) =>
                            setProgressDraft((prev) => ({ ...prev, [goal.id]: { ...draft, recordedDate: event.target.value } }))
                          }
                        />
                      </div>
                      <div className="field">
                        <label className="label" htmlFor={`progress-percent-${goal.id}`}>進捗%</label>
                        <input
                          id={`progress-percent-${goal.id}`}
                          className="input"
                          type="number"
                          min={0}
                          max={100}
                          value={draft.progressPercent}
                          onChange={(event) =>
                            setProgressDraft((prev) => ({
                              ...prev,
                              [goal.id]: { ...draft, progressPercent: Number(event.target.value) },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <input
                      className="input"
                      style={{ marginTop: 8 }}
                      placeholder="コメント（任意）"
                      value={draft.comment ?? ""}
                      onChange={(event) =>
                        setProgressDraft((prev) => ({ ...prev, [goal.id]: { ...draft, comment: event.target.value } }))
                      }
                    />
                    <button className="btn btn-sm btn-primary" style={{ marginTop: 8 }} onClick={() => void handleAddProgress(goal.id)}>
                      進捗を追加
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <div className="section-title">日報（監視）</div>
        {reports.length === 0 ? (
          <div className="empty-state">日報はありません</div>
        ) : (
          <div className="admin-table-wrap" style={{ marginTop: 10 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>日付</th>
                  <th>提出</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <Link className="admin-muted-link" href={`/admin/students/${student.id}/reports/${report.reportDate}`}>
                        {report.reportDate}
                      </Link>
                    </td>
                    <td>{report.submittedAt ? "提出済み" : "未提出"}</td>
                    <td>
                      <button className="btn btn-sm btn-danger" onClick={() => void handleDeleteReport(report.reportDate)}>
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
