"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { teacherApi, ApiError } from "@/lib/api";
import type {
  DailyReportListItemResponse,
  GoalResponse,
  ReportItemGroupResponse,
  StudentDashboardResponse,
  StudentResponse,
} from "@/lib/types";

interface Params {
  studentId: string;
}

export default function TeacherStudentInfoPage({ params }: { params: Promise<Params> }) {
  const { studentId } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [allStudents, setAllStudents] = useState<StudentResponse[]>([]);
  const [student, setStudent] = useState<StudentResponse | null>(null);
  const [dashboard, setDashboard] = useState<StudentDashboardResponse | null>(null);
  const [groups, setGroups] = useState<ReportItemGroupResponse[]>([]);
  const [reports, setReports] = useState<DailyReportListItemResponse[]>([]);
  const [showGoalHistory, setShowGoalHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    teacherApi.listAllStudents().then(setAllStudents).catch(() => {});
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [dash, groupList, reportList] = await Promise.all([
          teacherApi.getStudentDashboard(studentId),
          teacherApi.reportItemGroups.listGroups(studentId),
          teacherApi.listReports(studentId),
        ]);
        setDashboard(dash);
        setGroups(groupList);
        setReports(reportList);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "生徒情報の読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [studentId]);

  useEffect(() => {
    const found = allStudents.find((s) => s.id === studentId);
    if (found) setStudent(found);
  }, [allStudents, studentId]);

  const isOwner = !!student && !!user && student.teacherId === user.id;
  const goals: GoalResponse[] = dashboard?.goals ?? [];
  const currentGoals = goals.filter((g) => g.isCurrent);
  const pastGoals = goals.filter((g) => !g.isCurrent);
  const sortedReports = [...reports].sort((a, b) => b.reportDate.localeCompare(a.reportDate));

  if (loading) {
    return <div className="spinner-page">読み込み中...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>生徒情報</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="field">
          <label className="label">生徒を切り替え</label>
          <select
            className="select"
            value={studentId}
            onChange={(e) => router.push(`/teacher/students/${e.target.value}`)}
          >
            {allStudents.map((s) => (
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
          </div>
        )}
      </div>

      <div className="card">
        <div className="row-between">
          <div className="section-title">連続提出日数</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 600 }}>
            {dashboard?.consecutiveSubmissionDays ?? 0} 日
          </div>
        </div>
      </div>

      <div className="card">
        <div className="row-between">
          <div className="section-title">目標</div>
          {isOwner && (
            <Link className="btn btn-sm btn-ghost" href={`/teacher/goals?studentId=${studentId}`}>
              目標を管理
            </Link>
          )}
        </div>

        {currentGoals.length === 0 ? (
          <div className="empty-state">現在の目標がありません</div>
        ) : (
          <div className="stack">
            {currentGoals.map((goal) => (
              <div key={goal.id} className="stack-sm" style={{ paddingTop: "8px" }}>
                <div className="row" style={{ gap: 8, alignItems: "center" }}>
                  <div style={{ fontWeight: 600 }}>{goal.title}</div>
                  <span className="badge badge-success">現在</span>
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                  {new Date(goal.startDate).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })} 〜{" "}
                  {new Date(goal.endDate).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
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

        {pastGoals.length > 0 && (
          <div style={{ marginTop: "12px" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowGoalHistory(!showGoalHistory)}>
              {showGoalHistory ? "過去の目標を閉じる" : `過去の目標を表示（${pastGoals.length}件）`}
            </button>
            {showGoalHistory && (
              <div className="stack" style={{ marginTop: "10px" }}>
                {pastGoals.map((goal) => (
                  <div key={goal.id} className="stack-sm" style={{ paddingTop: "8px" }}>
                    <div style={{ fontWeight: 600 }}>{goal.title}</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                      {new Date(goal.startDate).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })} 〜{" "}
                      {new Date(goal.endDate).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <div className="row-between">
          <div className="section-title">日報項目グループ</div>
          {isOwner && (
            <Link className="btn btn-sm btn-ghost" href={`/teacher/report-items?studentId=${studentId}`}>
              日報項目を管理
            </Link>
          )}
        </div>

        {groups.length === 0 ? (
          <div className="empty-state">日報項目グループがありません</div>
        ) : (
          <div className="stack">
            {groups.map((group) => (
              <div key={group.id} className="row-between" style={{ paddingTop: "8px" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{group.goalTitle}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                    {new Date(group.startDate).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })} 〜{" "}
                    {new Date(group.endDate).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                  </div>
                </div>
                {group.isCurrent && <span className="badge badge-success">現在</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="section-title">日報一覧</div>
        {sortedReports.length === 0 ? (
          <div className="empty-state">日報がありません</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>日付</th>
                  <th>提出状況</th>
                </tr>
              </thead>
              <tbody>
                {sortedReports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <Link href={`/teacher/students/${studentId}/reports/${report.reportDate}`}>
                        {new Date(report.reportDate).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                      </Link>
                    </td>
                    <td>
                      <span className="badge badge-success">提出</span>
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
