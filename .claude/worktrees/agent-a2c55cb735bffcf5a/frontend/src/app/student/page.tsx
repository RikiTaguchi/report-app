"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { studentApi, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { FireIcon, AlertCircleIcon, HeartIcon, ChatIcon } from "@/components/icons";
import { Avatar } from "@/components/Avatar";
import type { StudentDashboardResponse } from "@/lib/types";

function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}分`;
  if (minutes === 0) return `${hours}時間`;
  return `${hours}時間${minutes}分`;
}

function formatYmd(dateStr: string): string {
  return dateStr.replaceAll("-", "/");
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<StudentDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGoals, setExpandedGoals] = useState<Record<string, boolean>>({});
  const [studyExpanded, setStudyExpanded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await studentApi.getDashboard();
        setDashboard(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("エラーが発生しました");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="page"><div className="spinner-page">読み込み中...</div></div>;
  }

  if (error) {
    return (
      <div className="page">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="page">
        <div className="empty-state">ダッシュボードを読み込めません</div>
      </div>
    );
  }

  const currentGoals = dashboard.goals.filter((g) => g.isCurrent);

  return (
    <div className="page">
      <div className="ig-story-section">
        <div className="ig-story-row">
          <div className="ig-story-scroll-item">
            <div className="ig-story-avatar-ring">
              <div className="ig-story-avatar">
                <Avatar
                  src={user?.profileImageUrl}
                  name={user?.name}
                  textClassName="ig-story-avatar-inner"
                  photoClassName="ig-story-avatar-photo"
                />
              </div>
            </div>
            <div className="ig-story-scroll-item-label">{user?.name ?? ""}</div>
          </div>
          <div className="ig-story-scroll-item">
            <div className="ig-story-avatar-ring">
              <div className="ig-story-avatar">
                <div className="ig-story-avatar-inner ig-story-avatar-inner-streak">
                  <span className="num">{dashboard.consecutiveSubmissionDays}</span>
                  <span className="unit">日</span>
                </div>
              </div>
            </div>
            <div className="ig-story-scroll-item-label">???</div>
          </div>
          <div className="ig-story-text">
            <div className="ig-story-title">レポート提出状況</div>
            {dashboard.consecutiveSubmissionDays > 0 && (
              <div className="ig-status-line streak">
                <FireIcon />
                <span className="ig-status-line-text">
                  連続提出{dashboard.consecutiveSubmissionDays}日目です
                </span>
              </div>
            )}
            {!dashboard.submittedToday && (
              <div className="ig-status-line warning">
                <AlertCircleIcon />
                <span className="ig-status-line-text">今日のレポートが未提出です</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="stack">
        {currentGoals.length === 0 ? (
          <div className="empty-state">現在進行中の目標はありません</div>
        ) : (
          currentGoals.map((goal) => {
            const expanded = Boolean(expandedGoals[goal.id]);
            const hasBodyContent =
              Boolean(goal.description) ||
              goal.reportItemSubtitleLabels.length > 0 ||
              Boolean(goal.latestProgress);

            const goalSummaryParts = [
              goal.description,
              ...goal.reportItemSubtitleLabels,
            ].filter(Boolean) as string[];
            if (goal.latestProgress) {
              goalSummaryParts.push(`達成状況 ${goal.latestProgress.progressPercent}%`);
            }
            const goalSummaryText = goalSummaryParts.join("　");

            return (
              <div key={goal.id} className="ig-card">
                <div className="ig-card-header">
                  <div className="ig-avatar">
                    <img
                      src={`https://picsum.photos/seed/goal-avatar-${goal.id}/80/80`}
                      alt=""
                      className="ig-avatar-photo"
                    />
                  </div>
                  <div className="ig-card-header-main">
                    <div className="ig-card-header-title">{goal.title}</div>
                    <div className="ig-card-header-sub">
                      {formatYmd(goal.startDate)}~{formatYmd(goal.endDate)}
                    </div>
                  </div>
                </div>
                <div className="ig-media">
                  <img
                    src={`https://picsum.photos/seed/goal-${goal.id}/640/640`}
                    alt=""
                    className="ig-post-photo"
                  />
                </div>
                <div className="ig-card-body" style={{ paddingTop: "12px" }}>
                  <div className="ig-action-bar">
                    <button className="ig-icon-btn liked" type="button">
                      <HeartIcon filled />
                      <span>1</span>
                    </button>
                    <button className="ig-icon-btn" type="button">
                      <ChatIcon />
                      <span>1</span>
                    </button>
                  </div>

                  {hasBodyContent && !expanded && (
                    <div className="ig-body-line-row">
                      <div className="ig-body-oneline">{goalSummaryText}</div>
                      <button
                        type="button"
                        className="ig-expand-toggle"
                        onClick={() =>
                          setExpandedGoals((prev) => ({ ...prev, [goal.id]: true }))
                        }
                      >
                        全体を表示
                      </button>
                    </div>
                  )}

                  {expanded && hasBodyContent && (
                    <div className="ig-card-body-full">
                      <div className="stack-sm">
                        {goal.description && (
                          <div className="ig-goal-description">{goal.description}</div>
                        )}
                        {goal.reportItemSubtitleLabels.length > 0 && (
                          <ul className="ig-goal-subtitle-list">
                            {goal.reportItemSubtitleLabels.map((label, idx) => (
                              <li key={idx}>{label}</li>
                            ))}
                          </ul>
                        )}
                        {goal.latestProgress && (
                          <>
                            <div className="progress-bar">
                              <div
                                className="progress-bar-fill"
                                style={{ width: `${goal.latestProgress.progressPercent}%` }}
                              />
                            </div>
                            <div className="muted" style={{ fontSize: "0.8rem" }}>
                              達成状況 {goal.latestProgress.progressPercent}% - {goal.latestProgress.recordedDate}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {(() => {
          const hasStudyBody = dashboard.studyTimeSummary.length > 0;
          const studySummaryText = [
            `合計 ${formatMinutes(dashboard.totalStudyMinutes)}`,
            ...(hasStudyBody
              ? dashboard.studyTimeSummary.map((s) => `${s.subjectName} ${formatMinutes(s.minutes)}`)
              : ["勉強時間の記録がまだありません"]),
          ].join("　");
          return (
            <div className="ig-card">
              <div className="ig-card-header">
                <div className="ig-avatar">
                  <img
                    src="https://picsum.photos/seed/study-record-avatar/80/80"
                    alt=""
                    className="ig-avatar-photo"
                  />
                </div>
                <div className="ig-card-header-main">
                  <div className="ig-card-header-title">勉強の記録</div>
                  <div className="ig-card-header-sub">レポートの内容を集計</div>
                </div>
              </div>
              <div className="ig-media">
                <img src="https://picsum.photos/seed/study-record/640/640" alt="" className="ig-post-photo" />
              </div>
              <div className="ig-card-body" style={{ paddingTop: "12px" }}>
                <div className="ig-action-bar">
                  <button className="ig-icon-btn liked" type="button">
                    <HeartIcon filled />
                    <span>1</span>
                  </button>
                  <button className="ig-icon-btn" type="button">
                    <ChatIcon />
                    <span>1</span>
                  </button>
                </div>

                {hasStudyBody ? (
                  !studyExpanded && (
                    <div className="ig-body-line-row">
                      <div className="ig-body-oneline">{studySummaryText}</div>
                      <button
                        type="button"
                        className="ig-expand-toggle"
                        onClick={() => setStudyExpanded(true)}
                      >
                        全体を表示
                      </button>
                    </div>
                  )
                ) : (
                  <div className="ig-body-oneline">{studySummaryText}</div>
                )}

                {studyExpanded && hasStudyBody && (
                  <div className="ig-card-body-full">
                    <div style={{ fontSize: "0.8rem" }}>
                      合計: <strong>{formatMinutes(dashboard.totalStudyMinutes)}</strong>
                    </div>
                    <div className="stack-sm" style={{ paddingLeft: "14px", width: "100%" }}>
                      {dashboard.studyTimeSummary.map((s) => (
                        <div key={s.subjectId} className="row-between" style={{ fontSize: "0.75rem" }}>
                          <span className="muted">{s.subjectName}</span>
                          <span>{formatMinutes(s.minutes)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        <div className="ig-card">
          <Link href="/student/reports" className="ig-card-header">
            <div className="ig-avatar-ring">
              <div className="ig-avatar">
                <img
                  src="https://picsum.photos/seed/reports-nav-avatar/80/80"
                  alt=""
                  className="ig-avatar-photo"
                />
              </div>
            </div>
            <div className="ig-card-header-main">
              <div className="ig-card-header-title">レポート管理</div>
              <div className="ig-card-header-sub">毎日提出しましょう</div>
            </div>
          </Link>
          <div className="ig-media">
            <img src="https://picsum.photos/seed/reports-nav/640/640" alt="" className="ig-post-photo" />
          </div>
          <div className="ig-card-body" style={{ paddingTop: "12px" }}>
            <div className="ig-action-bar">
              <button className="ig-icon-btn liked" type="button">
                <HeartIcon filled />
                <span>1</span>
              </button>
              <button className="ig-icon-btn" type="button">
                <ChatIcon />
                <span>1</span>
              </button>
            </div>

            <Link href="/student/reports" className="ig-view-comments-link">
              レポート一覧を確認する
            </Link>
          </div>
        </div>

        <div className="ig-card">
          <Link href="/student/blogs" className="ig-card-header">
            <div className="ig-avatar-ring">
              <div className="ig-avatar">
                <img
                  src="https://picsum.photos/seed/blogs-nav-avatar/80/80"
                  alt=""
                  className="ig-avatar-photo"
                />
              </div>
            </div>
            <div className="ig-card-header-main">
              <div className="ig-card-header-title">講師ブログ</div>
              <div className="ig-card-header-sub">講師からのメッセージを確認しましょう</div>
            </div>
          </Link>
          <div className="ig-media">
            <img src="https://picsum.photos/seed/blogs-nav/640/640" alt="" className="ig-post-photo" />
          </div>
          <div className="ig-card-body" style={{ paddingTop: "12px" }}>
            <div className="ig-action-bar">
              <button className="ig-icon-btn liked" type="button">
                <HeartIcon filled />
                <span>1</span>
              </button>
              <button className="ig-icon-btn" type="button">
                <ChatIcon />
                <span>1</span>
              </button>
            </div>

            <Link href="/student/blogs" className="ig-view-comments-link">
              新着ブログを確認する
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
