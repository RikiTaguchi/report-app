"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { teacherApi, ApiError } from "@/lib/api";
import { Avatar } from "@/components/Avatar";
import { FireIcon, TargetIcon, DocumentIcon } from "@/components/icons";
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

function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  });
}

export default function TeacherStudentInfoPage({ params }: { params: Promise<Params> }) {
  const { studentId } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [allStudents, setAllStudents] = useState<StudentResponse[]>([]);
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

  const student = allStudents.find((s) => s.id === studentId) ?? null;
  const isOwner = !!student && !!user && student.teacherId === user.id;
  const goals: GoalResponse[] = dashboard?.goals ?? [];
  const currentGoals = goals.filter((g) => g.isCurrent);
  const pastGoals = goals.filter((g) => !g.isCurrent);
  const sortedReports = [...reports].sort((a, b) => b.reportDate.localeCompare(a.reportDate));

  if (loading) {
    return <div className="spinner-page">読み込み中...</div>;
  }

  return (
    <div className="page ig-profile-page">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="ig-profile-top">
        <div className="ig-profile-avatar-lg">
          <Avatar name={student?.name} photoClassName="ig-profile-avatar-lg-photo" />
        </div>
        <div className="ig-profile-stats">
          <div className="ig-profile-stat">
            <div className="ig-profile-stat-num">{reports.length}</div>
            <div className="ig-profile-stat-label">日報</div>
          </div>
          <div className="ig-profile-stat">
            <div className="ig-profile-stat-num">{dashboard?.consecutiveSubmissionDays ?? 0}</div>
            <div className="ig-profile-stat-label">連続提出</div>
          </div>
          <div className="ig-profile-stat">
            <div className="ig-profile-stat-num">{currentGoals.length}</div>
            <div className="ig-profile-stat-label">現在の目標</div>
          </div>
        </div>
      </div>

      <div className="ig-profile-bio">
        <div className="ig-profile-name">{student?.name ?? "生徒情報"}</div>
        <div className="ig-profile-handle-row">
          <span className="ig-profile-handle">@{student?.username ?? studentId}</span>
          <span className="badge badge-muted">生徒</span>
        </div>
        <div className="ig-profile-note">
          担当講師: {student?.teacherName || "未割り当て"}
          {isOwner ? " ／ 担当中" : " ／ 閲覧のみ"}
        </div>
      </div>

      <div className="ig-story-section" style={{ margin: "18px -14px 0" }}>
        <div className="ig-story-row">
          <div className="ig-story-scroll">
            <div className="ig-story-scroll-item">
              <div className="ig-story-avatar-ring">
                <div className="ig-story-avatar">
                  <div className="ig-story-avatar-inner ig-story-avatar-inner-streak">
                    <span className="num">{dashboard?.consecutiveSubmissionDays ?? 0}</span>
                    <span className="unit">日</span>
                  </div>
                </div>
              </div>
              <div className="ig-story-scroll-item-label">連続提出</div>
            </div>
            {currentGoals.slice(0, 5).map((goal) => (
              <div key={goal.id} className="ig-story-scroll-item">
                <div className="ig-story-avatar-ring">
                  <div className="ig-story-avatar">
                    <div className="ig-story-avatar-inner" style={{ fontSize: "0.65rem", textAlign: "center", padding: 4 }}>
                      {goal.title.slice(0, 4)}
                    </div>
                  </div>
                </div>
                <div className="ig-story-scroll-item-label">目標</div>
              </div>
            ))}
          </div>
          <div className="ig-story-row-controls-vertical">
            <label className="label" htmlFor="teacher-student-switcher">生徒を切り替え</label>
            <select
              id="teacher-student-switcher"
              className="select"
              value={studentId}
              onChange={(e) => router.push(`/teacher/students/${e.target.value}`)}
            >
              {allStudents.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="stack" style={{ marginTop: 18 }}>
        <div className="ig-card">
          <div className="ig-card-header">
            <div className="ig-avatar"><TargetIcon /></div>
            <div className="ig-card-header-main">
              <div className="ig-card-header-title">目標</div>
              <div className="ig-card-header-sub">学習の現在地と過去の目標</div>
            </div>
            {isOwner && (
              <Link className="btn btn-sm btn-ghost" href={`/teacher/goals?studentId=${studentId}`}>管理</Link>
            )}
          </div>
          <div className="ig-card-body">
            {currentGoals.length === 0 ? (
              <div className="empty-state">現在の目標がありません</div>
            ) : (
              <div className="stack-sm">
                {currentGoals.map((goal) => (
                  <div key={goal.id} className="stack-sm" style={{ paddingTop: 4 }}>
                    <div className="row" style={{ gap: 8, alignItems: "center" }}>
                      <strong>{goal.title}</strong>
                      <span className="badge badge-success">現在</span>
                    </div>
                    <div className="muted" style={{ fontSize: "0.78rem" }}>
                      {formatDate(goal.startDate)} 〜 {formatDate(goal.endDate)}
                    </div>
                    {goal.latestProgress && (
                      <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${goal.latestProgress.progressPercent}%` }} /></div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {pastGoals.length > 0 && (
              <div>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowGoalHistory(!showGoalHistory)}>
                  {showGoalHistory ? "過去の目標を閉じる" : `過去の目標を表示（${pastGoals.length}件）`}
                </button>
                {showGoalHistory && (
                  <div className="stack-sm" style={{ marginTop: 10 }}>
                    {pastGoals.map((goal) => (
                      <div key={goal.id}>
                        <strong>{goal.title}</strong>
                        <div className="muted" style={{ fontSize: "0.78rem" }}>{formatDate(goal.startDate)} 〜 {formatDate(goal.endDate)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="ig-card">
          <div className="ig-card-header">
            <div className="ig-avatar"><DocumentIcon /></div>
            <div className="ig-card-header-main">
              <div className="ig-card-header-title">日報項目グループ</div>
              <div className="ig-card-header-sub">現在の提出フォーム</div>
            </div>
            {isOwner && (
              <Link className="btn btn-sm btn-ghost" href={`/teacher/report-items?studentId=${studentId}`}>管理</Link>
            )}
          </div>
          <div className="ig-card-body">
            {groups.length === 0 ? <div className="empty-state">日報項目グループがありません</div> : (
              <div className="stack-sm">
                {groups.map((group) => (
                  <div key={group.id} className="row-between" style={{ paddingTop: 4 }}>
                    <div><strong>{group.goalTitle}</strong><div className="muted" style={{ fontSize: "0.78rem" }}>{formatDate(group.startDate)} 〜 {formatDate(group.endDate)}</div></div>
                    {group.isCurrent && <span className="badge badge-success">現在</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="ig-card">
          <div className="ig-card-header">
            <div className="ig-avatar"><FireIcon /></div>
            <div className="ig-card-header-main">
              <div className="ig-card-header-title">日報一覧</div>
              <div className="ig-card-header-sub">提出されたレポートを確認</div>
            </div>
          </div>
          <div className="ig-card-body">
            {sortedReports.length === 0 ? <div className="empty-state">日報がありません</div> : (
              <div className="stack-sm">
                {sortedReports.map((report) => (
                  <Link key={report.id} href={`/teacher/students/${studentId}/reports/${report.reportDate}`} className="ig-card-header" style={{ margin: "0 -16px", borderTop: "1px solid var(--border)" }}>
                    <div className="ig-avatar" style={{ width: 34, height: 34, fontSize: "0.75rem" }}>{formatDate(report.reportDate).slice(-3, -1)}</div>
                    <div className="ig-card-header-main">
                      <div className="ig-card-header-title">{formatDate(report.reportDate)}</div>
                      <div className="ig-card-header-sub">{report.submittedAt ? "提出済み" : "未提出"}</div>
                    </div>
                    <span className="badge badge-success">提出</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
