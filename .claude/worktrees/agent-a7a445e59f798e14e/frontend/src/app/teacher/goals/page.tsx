"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { teacherApi, ApiError } from "@/lib/api";
import type { StudentResponse, GoalResponse, GoalCreateRequest, GoalProgressCreateRequest } from "@/lib/types";
import { useToast } from "@/components/Toast";

function GoalsPageContent() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const initialStudentId = searchParams.get("studentId") ?? undefined;
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [goals, setGoals] = useState<GoalResponse[]>([]);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingGoalData, setEditingGoalData] = useState<GoalCreateRequest | null>(null);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [editingProgressId, setEditingProgressId] = useState<string | null>(null);
  const [editingProgressData, setEditingProgressData] = useState<GoalProgressCreateRequest | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");

  const [newProgressPercent, setNewProgressPercent] = useState(0);
  const [newProgressComment, setNewProgressComment] = useState("");
  const [newProgressDate, setNewProgressDate] = useState(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" }));

  useEffect(() => {
    async function load() {
      try {
        const data = await teacherApi.listStudents();
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
    if (!selectedStudentId) return;

    async function load() {
      try {
        setLoadingGoals(true);
        const data = await teacherApi.goals.list(selectedStudentId);
        setGoals(data);
        setError(null);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        }
      } finally {
        setLoadingGoals(false);
      }
    }

    load();
  }, [selectedStudentId]);

  async function handleCreateGoal() {
    if (!selectedStudentId || !newTitle.trim()) return;

    try {
      setSubmitting(true);
      const created = await teacherApi.goals.create(selectedStudentId, {
        title: newTitle,
        description: newDescription || null,
        startDate: newStartDate,
        endDate: newEndDate,
      });
      setGoals([...goals, created]);
      setNewTitle("");
      setNewDescription("");
      setNewStartDate("");
      setNewEndDate("");
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(err.message, "error");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStartEditGoal(goal: GoalResponse) {
    setEditingGoalId(goal.id);
    setEditingGoalData({
      title: goal.title,
      description: goal.description,
      startDate: goal.startDate,
      endDate: goal.endDate,
    });
  }

  async function handleSaveEditGoal() {
    if (!selectedStudentId || !editingGoalId || !editingGoalData) return;

    try {
      setSubmitting(true);
      const updated = await teacherApi.goals.update(selectedStudentId, editingGoalId, editingGoalData);
      setGoals(goals.map((g) => (g.id === editingGoalId ? updated : g)));
      setEditingGoalId(null);
      setEditingGoalData(null);
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(err.message, "error");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteGoal(goalId: string) {
    if (!selectedStudentId || !confirm("削除しますか？")) return;

    try {
      setSubmitting(true);
      await teacherApi.goals.remove(selectedStudentId, goalId);
      setGoals(goals.filter((g) => g.id !== goalId));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateProgress(goalId: string) {
    if (!selectedStudentId) return;

    try {
      setSubmitting(true);
      await teacherApi.goals.createProgress(selectedStudentId, goalId, {
        progressPercent: newProgressPercent,
        comment: newProgressComment || null,
        recordedDate: newProgressDate,
      });
      const updated = await teacherApi.goals.get(selectedStudentId, goalId);
      setGoals(goals.map((g) => (g.id === goalId ? updated : g)));
      setNewProgressPercent(0);
      setNewProgressComment("");
      setNewProgressDate(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" }));
      setExpandedGoalId(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStartEditProgress(goalId: string, progressId: string) {
    const progress = goals
      .find((g) => g.id === goalId)
      ?.latestProgress;
    if (!progress) return;

    setEditingProgressId(progressId);
    setEditingProgressData({
      progressPercent: progress.progressPercent,
      comment: progress.comment,
      recordedDate: progress.recordedDate,
    });
  }

  async function handleSaveEditProgress(goalId: string) {
    if (!selectedStudentId || !editingProgressId || !editingProgressData) return;

    try {
      setSubmitting(true);
      await teacherApi.goals.updateProgress(selectedStudentId, goalId, editingProgressId, editingProgressData);
      const updated = await teacherApi.goals.get(selectedStudentId, goalId);
      setGoals(goals.map((g) => (g.id === goalId ? updated : g)));
      setEditingProgressId(null);
      setEditingProgressData(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteProgress(goalId: string, progressId: string) {
    if (!selectedStudentId || !confirm("削除しますか？")) return;

    try {
      setSubmitting(true);
      await teacherApi.goals.removeProgress(selectedStudentId, goalId, progressId);
      const updated = await teacherApi.goals.get(selectedStudentId, goalId);
      setGoals(goals.map((g) => (g.id === goalId ? updated : g)));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="spinner-page">読み込み中...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>目標管理</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

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
      </div>

      {loadingGoals ? (
        <div className="spinner-page">読み込み中...</div>
      ) : (
        <>
          {/* Create goal form */}
          <div className="card">
            <div className="section-title">新規作成</div>
            <div className="stack">
              <div className="field">
                <label className="label">タイトル</label>
                <input
                  className="input"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="例: 数学の点数を90点以上にする"
                  disabled={submitting}
                />
              </div>

              <div className="field">
                <label className="label">説明（オプション）</label>
                <textarea
                  className="textarea"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="詳細を入力"
                  disabled={submitting}
                />
              </div>

              <div className="field">
                <label className="label">開始日</label>
                <input
                  className="input"
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="field">
                <label className="label">終了日</label>
                <input
                  className="input"
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <button
                className="btn btn-primary"
                onClick={handleCreateGoal}
                disabled={submitting || !newTitle.trim() || !newStartDate || !newEndDate}
              >
                作成
              </button>
            </div>
          </div>

          {/* Goals list */}
          {goals.length === 0 ? (
            <div className="empty-state">目標がありません</div>
          ) : (
            <div className="stack">
              {goals.map((goal) =>
                editingGoalId === goal.id && editingGoalData ? (
                  <div key={goal.id} className="card">
                    <div className="stack">
                      <div className="field">
                        <label className="label">タイトル</label>
                        <input
                          className="input"
                          value={editingGoalData.title}
                          onChange={(e) => setEditingGoalData({ ...editingGoalData, title: e.target.value })}
                          disabled={submitting}
                        />
                      </div>

                      <div className="field">
                        <label className="label">説明</label>
                        <textarea
                          className="textarea"
                          value={editingGoalData.description || ""}
                          onChange={(e) => setEditingGoalData({ ...editingGoalData, description: e.target.value || null })}
                          disabled={submitting}
                        />
                      </div>

                      <div className="field">
                        <label className="label">開始日</label>
                        <input
                          className="input"
                          type="date"
                          value={editingGoalData.startDate}
                          onChange={(e) => setEditingGoalData({ ...editingGoalData, startDate: e.target.value })}
                          disabled={submitting}
                        />
                      </div>

                      <div className="field">
                        <label className="label">終了日</label>
                        <input
                          className="input"
                          type="date"
                          value={editingGoalData.endDate}
                          onChange={(e) => setEditingGoalData({ ...editingGoalData, endDate: e.target.value })}
                          disabled={submitting}
                        />
                      </div>

                      <div className="row">
                        <button
                          className="btn btn-primary"
                          onClick={handleSaveEditGoal}
                          disabled={submitting}
                        >
                          保存
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() => {
                            setEditingGoalId(null);
                            setEditingGoalData(null);
                          }}
                          disabled={submitting}
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={goal.id} className="card">
                    <div className="row-between">
                      <div className="stack-sm">
                        <div className="row" style={{ gap: 8, alignItems: "center" }}>
                          <div className="section-title">{goal.title}</div>
                          {goal.isCurrent && <span className="badge badge-success">現在</span>}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                          {new Date(goal.startDate).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })} 〜 {new Date(goal.endDate).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                        </div>
                        {goal.description && (
                          <div style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
                            {goal.description}
                          </div>
                        )}
                        {goal.latestProgress && (
                          <div className="stack-sm">
                            <div className="progress-bar">
                              <div
                                className="progress-bar-fill"
                                style={{ width: `${goal.latestProgress.progressPercent}%` }}
                              />
                            </div>
                            <div style={{ fontSize: "0.85rem" }}>
                              進捗: {goal.latestProgress.progressPercent}%
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="row">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() =>
                            setExpandedGoalId(expandedGoalId === goal.id ? null : goal.id)
                          }
                          disabled={submitting}
                        >
                          {expandedGoalId === goal.id ? "閉じる" : "進捗"}
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleStartEditGoal(goal)}
                          disabled={submitting}
                        >
                          編集
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteGoal(goal.id)}
                          disabled={submitting}
                        >
                          削除
                        </button>
                      </div>
                    </div>

                    {expandedGoalId === goal.id && (
                      <div className="stack" style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
                        {/* Progress form */}
                        <div>
                          <div className="section-title">進捗を記録</div>
                          <div className="stack">
                            <div className="field">
                              <label className="label">進捗率（%）</label>
                              <input
                                className="input"
                                type="number"
                                min="0"
                                max="100"
                                value={newProgressPercent}
                                onChange={(e) => setNewProgressPercent(Number(e.target.value))}
                                disabled={submitting}
                              />
                            </div>

                            <div className="field">
                              <label className="label">コメント（オプション）</label>
                              <textarea
                                className="textarea"
                                value={newProgressComment}
                                onChange={(e) => setNewProgressComment(e.target.value)}
                                placeholder="進捗状況の詳細"
                                disabled={submitting}
                              />
                            </div>

                            <div className="field">
                              <label className="label">日付</label>
                              <input
                                className="input"
                                type="date"
                                value={newProgressDate}
                                onChange={(e) => setNewProgressDate(e.target.value)}
                                disabled={submitting}
                              />
                            </div>

                            <button
                              className="btn btn-primary"
                              onClick={() => handleCreateProgress(goal.id)}
                              disabled={submitting}
                            >
                              記録
                            </button>
                          </div>
                        </div>

                        {/* Latest progress display */}
                        {goal.latestProgress &&
                          (editingProgressId === goal.latestProgress.id && editingProgressData ? (
                            <div>
                              <div className="section-title">進捗を編集</div>
                              <div className="stack">
                                <div className="field">
                                  <label className="label">進捗率（%）</label>
                                  <input
                                    className="input"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={editingProgressData.progressPercent}
                                    onChange={(e) => setEditingProgressData({ ...editingProgressData, progressPercent: Number(e.target.value) })}
                                    disabled={submitting}
                                  />
                                </div>

                                <div className="field">
                                  <label className="label">コメント</label>
                                  <textarea
                                    className="textarea"
                                    value={editingProgressData.comment || ""}
                                    onChange={(e) => setEditingProgressData({ ...editingProgressData, comment: e.target.value || null })}
                                    disabled={submitting}
                                  />
                                </div>

                                <div className="field">
                                  <label className="label">日付</label>
                                  <input
                                    className="input"
                                    type="date"
                                    value={editingProgressData.recordedDate}
                                    onChange={(e) => setEditingProgressData({ ...editingProgressData, recordedDate: e.target.value })}
                                    disabled={submitting}
                                  />
                                </div>

                                <div className="row">
                                  <button
                                    className="btn btn-primary"
                                    onClick={() => handleSaveEditProgress(goal.id)}
                                    disabled={submitting}
                                  >
                                    保存
                                  </button>
                                  <button
                                    className="btn btn-ghost"
                                    onClick={() => {
                                      setEditingProgressId(null);
                                      setEditingProgressData(null);
                                    }}
                                    disabled={submitting}
                                  >
                                    キャンセル
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="card">
                              <div className="row-between">
                                <div className="stack-sm">
                                  <div className="section-title">
                                    {new Date(goal.latestProgress.recordedDate).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                                  </div>
                                  <div>{goal.latestProgress.progressPercent}% 完了</div>
                                  {goal.latestProgress.comment && (
                                    <div style={{ fontSize: "0.9rem" }}>
                                      {goal.latestProgress.comment}
                                    </div>
                                  )}
                                </div>
                                <div className="row">
                                  <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => handleStartEditProgress(goal.id, goal.latestProgress!.id)}
                                    disabled={submitting}
                                  >
                                    編集
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDeleteProgress(goal.id, goal.latestProgress!.id)}
                                    disabled={submitting}
                                  >
                                    削除
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function GoalsPage() {
  return (
    <Suspense fallback={<div className="spinner-page">読み込み中...</div>}>
      <GoalsPageContent />
    </Suspense>
  );
}
