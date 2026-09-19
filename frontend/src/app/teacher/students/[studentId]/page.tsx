"use client";

import { use, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { teacherApi, ApiError } from "@/lib/api";
import { Avatar } from "@/components/Avatar";
import { ChevronDownIcon, ChevronLeftIcon, ChevronUpIcon, TargetIcon } from "@/components/icons";
import type {
  GoalResponse,
  ReportItemDefinitionResponse,
  ReportItemGroupResponse,
  ReportItemSubtitleResponse,
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

const HIGHLIGHTS = [
  { key: "study", seed: "profile-highlight-study", label: "勉強" },
  { key: "goal", seed: "profile-highlight-goal", label: "目標" },
  { key: "report", seed: "profile-highlight-report", label: "レポート" },
  { key: "memory", seed: "profile-highlight-memory", label: "思い出" },
  { key: "effort", seed: "profile-highlight-effort", label: "頑張り" },
  { key: "daily", seed: "profile-highlight-daily", label: "日常" },
];

export default function TeacherStudentInfoPage({ params }: { params: Promise<Params> }) {
  const { studentId } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [allStudents, setAllStudents] = useState<StudentResponse[]>([]);
  const [dashboard, setDashboard] = useState<StudentDashboardResponse | null>(null);
  const [groups, setGroups] = useState<ReportItemGroupResponse[]>([]);
  const [expandedGoals, setExpandedGoals] = useState<Record<string, boolean>>({});
  const [expandedSubtitles, setExpandedSubtitles] = useState<Record<string, boolean>>({});
  const [subtitlesByGroup, setSubtitlesByGroup] = useState<Record<string, ReportItemSubtitleResponse[]>>({});
  const [itemsBySubtitle, setItemsBySubtitle] = useState<Record<string, ReportItemDefinitionResponse[]>>({});
  const [loadingGroups, setLoadingGroups] = useState<Record<string, boolean>>({});
  const [groupLoadErrors, setGroupLoadErrors] = useState<Record<string, string>>({});
  const [progressGoal, setProgressGoal] = useState<GoalResponse | null>(null);
  const [progressValue, setProgressValue] = useState("0");
  const [progressDate, setProgressDate] = useState("");
  const [progressComment, setProgressComment] = useState("");
  const [progressSaving, setProgressSaving] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);
  const loadGeneration = useRef(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    teacherApi.listAllStudents().then(setAllStudents).catch(() => {});
  }, []);

  useEffect(() => {
    const generation = ++loadGeneration.current;
    setExpandedGoals({});
    setExpandedSubtitles({});
    setSubtitlesByGroup({});
    setItemsBySubtitle({});
    setLoadingGroups({});
    setGroupLoadErrors({});
    setProgressGoal(null);
    setProgressError(null);

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [dash, groupList] = await Promise.all([
          teacherApi.getStudentDashboard(studentId),
          teacherApi.reportItemGroups.listGroups(studentId),
        ]);
        if (generation !== loadGeneration.current) return;
        setDashboard(dash);
        setGroups(groupList);
      } catch (err) {
        if (generation !== loadGeneration.current) return;
        setError(err instanceof ApiError ? err.message : "生徒情報の読み込みに失敗しました");
      } finally {
        if (generation === loadGeneration.current) setLoading(false);
      }
    }

    load();
  }, [studentId]);

  const student = allStudents.find((s) => s.id === studentId) ?? null;
  const isOwner = !!student && !!user && student.teacherId === user.id;
  const goals: GoalResponse[] = dashboard?.goals ?? [];
  const sortByStartDateNewest = (a: GoalResponse, b: GoalResponse) =>
    b.startDate.localeCompare(a.startDate) || b.endDate.localeCompare(a.endDate);
  const sortedGoals = [...goals].sort(sortByStartDateNewest);

  async function loadGroupDetails(groupId: string, force = false) {
    if (!force && subtitlesByGroup[groupId]) return;
    const generation = loadGeneration.current;
    setLoadingGroups((prev) => ({ ...prev, [groupId]: true }));
    setGroupLoadErrors((prev) => {
      const next = { ...prev };
      delete next[groupId];
      return next;
    });
    try {
      const subtitles = await teacherApi.reportItemGroups.listSubtitles(studentId, groupId);
      const orderedSubtitles = [...subtitles].sort((a, b) => a.displayOrder - b.displayOrder);
      const itemEntries = await Promise.all(
        orderedSubtitles.map(async (subtitle) => {
          const items = await teacherApi.reportItemGroups.listItems(studentId, groupId, subtitle.id);
          return [subtitle.id, [...items].sort((a, b) => a.displayOrder - b.displayOrder)] as const;
        })
      );
      if (generation !== loadGeneration.current) return;
      setSubtitlesByGroup((prev) => ({ ...prev, [groupId]: orderedSubtitles }));
      setItemsBySubtitle((prev) => ({ ...prev, ...Object.fromEntries(itemEntries) }));
    } catch (err) {
      if (generation !== loadGeneration.current) return;
      setGroupLoadErrors((prev) => ({
        ...prev,
        [groupId]: err instanceof ApiError ? err.message : "日報項目の読み込みに失敗しました",
      }));
    } finally {
      if (generation === loadGeneration.current) {
        setLoadingGroups((prev) => ({ ...prev, [groupId]: false }));
      }
    }
  }

  function toggleGoal(goalId: string, goalGroups: ReportItemGroupResponse[]) {
    const nextExpanded = !expandedGoals[goalId];
    setExpandedGoals((prev) => ({ ...prev, [goalId]: nextExpanded }));
    if (nextExpanded) {
      goalGroups.forEach((group) => void loadGroupDetails(group.id));
    }
  }

  function toggleSubtitle(groupId: string, subtitleId: string) {
    const key = `${groupId}:${subtitleId}`;
    const nextExpanded = !expandedSubtitles[key];
    setExpandedSubtitles((prev) => ({ ...prev, [key]: nextExpanded }));
    if (nextExpanded && !itemsBySubtitle[subtitleId]) {
      const generation = loadGeneration.current;
      teacherApi.reportItemGroups.listItems(studentId, groupId, subtitleId)
        .then((items) => {
          if (generation !== loadGeneration.current) return;
          setItemsBySubtitle((prev) => ({
            ...prev,
            [subtitleId]: [...items].sort((a, b) => a.displayOrder - b.displayOrder),
          }));
        })
        .catch((err) => {
          if (generation !== loadGeneration.current) return;
          setGroupLoadErrors((prev) => ({
            ...prev,
            [groupId]: err instanceof ApiError ? err.message : "日報項目の読み込みに失敗しました",
          }));
        });
    }
  }

  function todayInJapan() {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
  }

  function openProgressModal(goal: GoalResponse) {
    const latest = goal.latestProgress;
    setProgressGoal(goal);
    setProgressValue(String(latest?.progressPercent ?? 0));
    setProgressDate(latest?.recordedDate ?? todayInJapan());
    setProgressComment(latest?.comment ?? "");
    setProgressError(null);
  }

  function closeProgressModal() {
    if (!progressSaving) setProgressGoal(null);
  }

  async function saveProgress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!progressGoal) return;

    const percent = Number(progressValue);
    if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
      setProgressError("達成率は0〜100の整数で入力してください");
      return;
    }
    if (!progressDate) {
      setProgressError("記録日を入力してください");
      return;
    }

    const generation = loadGeneration.current;
    setProgressSaving(true);
    setProgressError(null);
    const request = {
      progressPercent: percent,
      recordedDate: progressDate,
      comment: progressComment.trim() || null,
    };
    try {
      if (progressGoal.latestProgress) {
        await teacherApi.goals.updateProgress(
          studentId,
          progressGoal.id,
          progressGoal.latestProgress.id,
          request,
        );
      } else {
        await teacherApi.goals.createProgress(studentId, progressGoal.id, request);
      }
      const updatedDashboard = await teacherApi.getStudentDashboard(studentId);
      if (generation === loadGeneration.current) {
        setDashboard(updatedDashboard);
        setProgressGoal(null);
      }
    } catch (err) {
      if (generation === loadGeneration.current) {
        setProgressError(err instanceof ApiError ? err.message : "達成率の更新に失敗しました");
      }
    } finally {
      setProgressSaving(false);
    }
  }

  useEffect(() => {
    if (!progressGoal) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeProgressModal();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [progressGoal, progressSaving]);

  function renderGoal(goal: GoalResponse) {
    const expanded = Boolean(expandedGoals[goal.id]);
    const goalGroups = groups.filter((group) => group.goalId === goal.id);
    const progress = goal.latestProgress?.progressPercent ?? 0;

    return (
      <article key={goal.id} className="ig-goal-card">
        <div className="ig-goal-card-header">
          <button
            type="button"
            className="ig-goal-toggle"
            aria-expanded={expanded}
            aria-controls={`goal-${goal.id}`}
            onClick={() => toggleGoal(goal.id, goalGroups)}
          >
            <span className="ig-avatar ig-goal-avatar"><TargetIcon /></span>
            <span className="ig-goal-card-heading">
              <span className="ig-goal-card-title">{goal.title}</span>
              <span className="ig-goal-card-meta">{formatDate(goal.startDate)} 〜 {formatDate(goal.endDate)}</span>
            </span>
            <span className="ig-goal-chevron" aria-hidden="true">
              {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </span>
          </button>
          {isOwner && (
            <Link
              className="ig-goal-edit-link"
              href={`/teacher/goals/${goal.id}/edit?studentId=${studentId}`}
            >
              編集
            </Link>
          )}
        </div>
        {expanded && (
          <div id={`goal-${goal.id}`} className="ig-goal-card-body">
            <div className="ig-goal-progress">
              <div className="ig-goal-progress-header">
                <span>達成率</span>
                <span className="ig-goal-progress-actions">
                  <strong>{progress}%</strong>
                  {isOwner && (
                    <button
                      type="button"
                      className="ig-goal-progress-update"
                      onClick={() => openProgressModal(goal)}
                    >
                      更新
                    </button>
                  )}
                </span>
              </div>
              <div className="progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label={`${goal.title}の達成率`}>
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
            {goalGroups.length === 0 ? (
              <div className="empty-state">項目がありません</div>
            ) : (
              goalGroups.map((group) => {
                const subtitles = subtitlesByGroup[group.id] ?? [];
                const groupError = groupLoadErrors[group.id];
                const groupLoading = Boolean(loadingGroups[group.id]);
                return (
                  <div key={group.id} className="ig-goal-subtitle-list">
                    {groupLoading && <div className="muted">読み込み中...</div>}
                    {groupError && (
                      <div className="stack-sm">
                        <div className="alert alert-error">{groupError}</div>
                        <button type="button" className="btn btn-sm btn-ghost" onClick={() => void loadGroupDetails(group.id, true)}>
                          再読み込み
                        </button>
                      </div>
                    )}
                    {!groupLoading && !groupError && subtitles.length === 0 && (
                      <div className="empty-state">項目がありません</div>
                    )}
                    {!groupLoading && !groupError && subtitles.map((subtitle) => {
                      const subtitleKey = `${group.id}:${subtitle.id}`;
                      const subtitleExpanded = Boolean(expandedSubtitles[subtitleKey]);
                      const items = itemsBySubtitle[subtitle.id] ?? [];
                      return (
                        <div key={subtitle.id} className="ig-goal-subtitle-block">
                          <button
                            type="button"
                            className="ig-goal-subtitle-toggle"
                            aria-expanded={subtitleExpanded}
                            aria-controls={`subtitle-${subtitle.id}`}
                            onClick={() => toggleSubtitle(group.id, subtitle.id)}
                          >
                            <span>{subtitle.label}</span>
                            {subtitleExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                          </button>
                          {subtitleExpanded && (
                            <div id={`subtitle-${subtitle.id}`} className="ig-goal-item-list">
                              {!itemsBySubtitle[subtitle.id] ? (
                                <div className="muted">読み込み中...</div>
                              ) : items.length === 0 ? (
                                <div className="muted">項目がありません</div>
                              ) : (
                                items.map((item) => (
                                  <label className="ig-goal-item" key={item.id}>
                                    <input type="checkbox" className="ig-checkbox" disabled readOnly />
                                    <span>{item.label}</span>
                                  </label>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        )}
      </article>
    );
  }

  if (loading) {
    return <div className="spinner-page">読み込み中...</div>;
  }

  return (
    <div className="page ig-profile-page">
      <button
        type="button"
        className="ig-profile-back-button"
        onClick={() => router.push("/teacher/students")}
        aria-label="生徒管理へ戻る"
      >
        <ChevronLeftIcon />
        <span>生徒管理へ戻る</span>
      </button>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="ig-profile-top">
        <div className="ig-profile-avatar-lg">
          <Avatar name={student?.name} photoClassName="ig-profile-avatar-lg-photo" />
        </div>
        <div className="ig-profile-stats">
          <div className="ig-profile-stat">
            <div className="ig-profile-stat-num">{sortedGoals.length}</div>
            <div className="ig-profile-stat-label">投稿</div>
          </div>
          <div className="ig-profile-stat">
            <div className="ig-profile-stat-num">???</div>
            <div className="ig-profile-stat-label">フォロワー</div>
          </div>
          <div className="ig-profile-stat">
            <div className="ig-profile-stat-num">???</div>
            <div className="ig-profile-stat-label">フォロー中</div>
          </div>
        </div>
      </div>

      <div className="ig-profile-bio">
        <div className="ig-profile-name">{student?.name ?? "生徒情報"}</div>
        <div className="ig-profile-handle-row">
          <span className="ig-profile-handle">@{student?.username ?? studentId}</span>
          <span className="badge badge-muted">生徒</span>
          <span className="ig-profile-note">
            担当講師: {student?.teacherName || "未割り当て"}
            {!isOwner && " ／ 閲覧のみ"}
          </span>
        </div>
      </div>

      <div className="ig-story-section" style={{ margin: "-6px -14px 0" }}>
        <div className="ig-story-row">
          <div className="ig-story-scroll">
            <Link
              href={`/teacher/students/${studentId}/reports`}
              className="ig-story-scroll-item"
              aria-label="日報一覧を表示"
            >
              <div className="ig-story-avatar-ring">
                <div className="ig-story-avatar">
                  <div className="ig-story-avatar-inner ig-story-avatar-inner-streak">
                    <span className="num">{dashboard?.consecutiveSubmissionDays ?? 0}</span>
                    <span className="unit">日</span>
                  </div>
                </div>
              </div>
              <div className="ig-story-scroll-item-label">連続提出</div>
            </Link>
            {sortedGoals.filter((goal) => goal.isCurrent).slice(0, 3).map((goal) => (
              <div key={goal.id} className="ig-story-scroll-item">
                <div className="ig-story-avatar-ring">
                  <div className="ig-story-avatar">
                    <div className="ig-story-avatar-inner ig-story-avatar-inner-streak">
                      <span className="num">{goal.latestProgress?.progressPercent ?? 0}</span>
                      <span className="unit">%</span>
                    </div>
                  </div>
                </div>
                <div className="ig-story-scroll-item-label">達成率</div>
              </div>
            ))}
            <div className="ig-story-scroll-item">
              <div className="ig-story-avatar-ring">
                <div className="ig-story-avatar">
                  <div className="ig-story-avatar-inner ig-story-avatar-inner-streak ig-story-avatar-inner-study">
                    <span className="study-line">
                      <span className="num">{Math.floor((dashboard?.totalStudyMinutes ?? 0) / 60)}</span>
                      <span className="unit">時間</span>
                    </span>
                    <span className="study-line">
                      <span className="num">{(dashboard?.totalStudyMinutes ?? 0) % 60}</span>
                      <span className="unit">分</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="ig-story-scroll-item-label">学習時間</div>
            </div>
            {HIGHLIGHTS.map((highlight) => (
              <div key={highlight.key} className="ig-story-scroll-item">
                <div className="ig-story-avatar-ring">
                  <div className="ig-story-avatar">
                    <img
                      src={`https://picsum.photos/seed/${highlight.seed}/100/100`}
                      alt=""
                      className="ig-story-avatar-photo"
                    />
                  </div>
                </div>
                <div className="ig-story-scroll-item-label">{highlight.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ig-goal-section">
        <div className="ig-card ig-goal-feed">
          <div className="ig-card-header ig-goal-feed-header">
            <div className="ig-card-header-main">
              <div className="ig-card-header-title">進捗管理</div>
              <div className="ig-card-header-sub">レポート項目と進捗の管理</div>
            </div>
            {isOwner && (
              <Link className="ig-goal-new-link" href={`/teacher/goals/new?studentId=${studentId}`}>
                新規登録
              </Link>
            )}
          </div>
          <div className="ig-card-body ig-goal-list">
            {sortedGoals.length === 0 ? (
              <div className="empty-state">目標がありません</div>
            ) : (
              <div className="stack-sm">{sortedGoals.map(renderGoal)}</div>
            )}
          </div>
        </div>
      </div>

      {progressGoal && (
        <div
          className="ig-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeProgressModal();
          }}
        >
          <div
            className="ig-modal-panel ig-goal-progress-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="goal-progress-modal-title"
          >
            <div className="ig-goal-progress-modal-heading">
              <div>
                <div id="goal-progress-modal-title" className="ig-modal-title">達成率を更新</div>
                <div className="ig-goal-progress-modal-goal">{progressGoal.title}</div>
              </div>
              <button
                type="button"
                className="ig-modal-close"
                onClick={closeProgressModal}
                disabled={progressSaving}
                aria-label="モーダルを閉じる"
              >
                ×
              </button>
            </div>
            <form className="ig-goal-progress-form" onSubmit={(event) => void saveProgress(event)}>
              <div className="field">
                <label className="label" htmlFor="goal-progress-percent">達成率（%）</label>
                <input
                  id="goal-progress-percent"
                  className="input"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={progressValue}
                  onChange={(event) => setProgressValue(event.target.value)}
                  disabled={progressSaving}
                  required
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="goal-progress-date">記録日</label>
                <input
                  id="goal-progress-date"
                  className="input"
                  type="date"
                  value={progressDate}
                  onChange={(event) => setProgressDate(event.target.value)}
                  disabled={progressSaving}
                  required
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="goal-progress-comment">コメント <span className="muted">任意</span></label>
                <textarea
                  id="goal-progress-comment"
                  className="textarea"
                  value={progressComment}
                  onChange={(event) => setProgressComment(event.target.value)}
                  disabled={progressSaving}
                  placeholder="進捗についてのメモ"
                />
              </div>
              {progressError && <div className="alert alert-error" role="alert" aria-live="polite">{progressError}</div>}
              <div className="ig-modal-actions">
                <button className="btn btn-primary btn-sm" type="submit" disabled={progressSaving}>
                  {progressSaving ? "保存中..." : "保存"}
                </button>
                <button className="btn btn-ghost btn-sm" type="button" onClick={closeProgressModal} disabled={progressSaving}>
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
