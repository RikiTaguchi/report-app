"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { adminApi, ApiError } from "@/lib/api";
import type {
  StudentResponse,
  GoalResponse,
  GoalProgressResponse,
  GoalCreateRequest,
  GoalProgressCreateRequest,
} from "@/lib/types";
import { useToast } from "@/components/Toast";

interface FormState {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
}

interface EditingGoal {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
}

interface AddingProgress {
  goalId: string;
  progressPercent: number;
  comment: string;
  recordedDate: string;
}

function GoalsPageContent() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const initialStudentId = searchParams.get("studentId") ?? undefined;
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [goals, setGoals] = useState<GoalResponse[]>([]);
  const [progresses, setProgresses] = useState<Record<string, GoalProgressResponse[]>>({});
  const [loading, setLoading] = useState(true);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [editingGoal, setEditingGoal] = useState<EditingGoal | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [addingProgress, setAddingProgress] = useState<AddingProgress | null>(null);
  const [progressSubmitting, setProgressSubmitting] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
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

  useEffect(() => {
    if (selectedStudentId) {
      loadGoals();
    }
  }, [selectedStudentId]);

  async function loadGoals() {
    setGoalsLoading(true);
    setError(null);
    try {
      const data = await adminApi.goals.list(selectedStudentId);
      setGoals(data);
      setProgresses({});
      for (const goal of data) {
        const progs = await adminApi.goals.listProgresses(selectedStudentId, goal.id);
        setProgresses((prev) => ({ ...prev, [goal.id]: progs }));
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    } finally {
      setGoalsLoading(false);
    }
  }

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudentId) {
      setError("生徒を選択してください");
      return;
    }
    setFormSubmitting(true);
    setError(null);
    try {
      const req: GoalCreateRequest = {
        title: form.title,
        description: form.description || null,
        startDate: form.startDate,
        endDate: form.endDate,
      };
      const newGoal = await adminApi.goals.create(selectedStudentId, req);
      setGoals([...goals, newGoal]);
      setProgresses((prev) => ({ ...prev, [newGoal.id]: [] }));
      setForm({ title: "", description: "", startDate: "", endDate: "" });
      setSuccessMsg("目標を作成しました");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(err.message, "error");
      }
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleUpdateGoal() {
    if (!editingGoal || !selectedStudentId) return;
    setEditSubmitting(true);
    setError(null);
    try {
      const req: GoalCreateRequest = {
        title: editingGoal.title,
        description: editingGoal.description || null,
        startDate: editingGoal.startDate,
        endDate: editingGoal.endDate,
      };
      const updated = await adminApi.goals.update(selectedStudentId, editingGoal.id, req);
      setGoals(goals.map((g) => (g.id === editingGoal.id ? updated : g)));
      setEditingGoal(null);
      setSuccessMsg("目標を更新しました");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(err.message, "error");
      }
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDeleteGoal(id: string) {
    if (!window.confirm("この目標を削除してもよろしいですか?")) return;
    if (!selectedStudentId) return;
    setError(null);
    try {
      await adminApi.goals.remove(selectedStudentId, id);
      setGoals(goals.filter((g) => g.id !== id));
      const newProgresses = { ...progresses };
      delete newProgresses[id];
      setProgresses(newProgresses);
      setSuccessMsg("目標を削除しました");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    }
  }

  async function handleAddProgress() {
    if (!addingProgress || !selectedStudentId) return;
    setProgressSubmitting(true);
    setError(null);
    try {
      const req: GoalProgressCreateRequest = {
        progressPercent: addingProgress.progressPercent,
        comment: addingProgress.comment || null,
        recordedDate: addingProgress.recordedDate,
      };
      const newProg = await adminApi.goals.createProgress(
        selectedStudentId,
        addingProgress.goalId,
        req
      );
      setProgresses((prev) => ({
        ...prev,
        [addingProgress.goalId]: [...(prev[addingProgress.goalId] || []), newProg],
      }));
      setAddingProgress(null);
      setSuccessMsg("進捗を追加しました");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    } finally {
      setProgressSubmitting(false);
    }
  }

  async function handleDeleteProgress(goalId: string, progressId: string) {
    if (!window.confirm("この進捗記録を削除してもよろしいですか?")) return;
    if (!selectedStudentId) return;
    setError(null);
    try {
      await adminApi.goals.removeProgress(selectedStudentId, goalId, progressId);
      setProgresses((prev) => ({
        ...prev,
        [goalId]: prev[goalId]?.filter((p) => p.id !== progressId) || [],
      }));
      setSuccessMsg("進捗記録を削除しました");
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

  const currentStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="page">
      <div className="page-header">
        <h1>目標</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="card">
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
        {currentStudent && (
          <div className="muted" style={{ marginTop: "8px", fontSize: "0.85rem" }}>
            担当講師: {currentStudent.teacherName || "未割り当て"}
          </div>
        )}
      </div>

      {goalsLoading ? (
        <div className="empty-state">読み込み中...</div>
      ) : (
        <>
          <div className="card">
            <div className="section-title">新規作成</div>
            <form onSubmit={handleCreateGoal} className="stack">
              <div className="field">
                <label className="label">タイトル</label>
                <input
                  type="text"
                  className="input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label className="label">説明</label>
                <textarea
                  className="textarea"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="label">開始日</label>
                <input
                  type="date"
                  className="input"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label className="label">終了日</label>
                <input
                  type="date"
                  className="input"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={formSubmitting}>
                {formSubmitting ? "作成中..." : "作成"}
              </button>
            </form>
          </div>

          <div className="stack">
            {goals.map((goal) => (
              <div key={goal.id} className="card">
                <div className="row-between">
                  <div>
                    <div className="row" style={{ gap: 8, alignItems: "center" }}>
                      <div className="section-title">{goal.title}</div>
                      {goal.isCurrent && <span className="badge badge-success">現在</span>}
                    </div>
                    {goal.description && (
                      <div className="muted" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                        {goal.description}
                      </div>
                    )}
                    <div
                      className="muted"
                      style={{ fontSize: "0.85rem", marginTop: "4px" }}
                    >
                      期間: {new Date(goal.startDate).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })} 〜{" "}
                      {new Date(goal.endDate).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                    </div>
                    {goal.latestProgress && (
                      <div style={{ marginTop: "10px" }}>
                        <div
                          className="progress-bar"
                          style={{
                            height: "12px",
                            marginBottom: "4px",
                          }}
                        >
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${goal.latestProgress.progressPercent}%`,
                            }}
                          />
                        </div>
                        <div className="muted" style={{ fontSize: "0.8rem" }}>
                          {goal.latestProgress.progressPercent}% 進捗
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="row">
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() =>
                        setEditingGoal({
                          id: goal.id,
                          title: goal.title,
                          description: goal.description || "",
                          startDate: goal.startDate,
                          endDate: goal.endDate,
                        })
                      }
                    >
                      編集
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteGoal(goal.id)}
                    >
                      削除
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--border)" }}>
                  <div className="section-title" style={{ marginBottom: "10px" }}>
                    進捗記録
                  </div>

                  {(progresses[goal.id] || []).length > 0 && (
                    <div className="stack-sm" style={{ marginBottom: "12px" }}>
                      {progresses[goal.id]?.map((prog) => (
                        <div key={prog.id} className="row-between">
                          <div style={{ flex: 1 }}>
                            <div className="muted" style={{ fontSize: "0.85rem" }}>
                              {new Date(prog.recordedDate).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })} -{" "}
                              {prog.progressPercent}%
                            </div>
                            {prog.comment && (
                              <div style={{ fontSize: "0.9rem", marginTop: "2px" }}>
                                {prog.comment}
                              </div>
                            )}
                          </div>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteProgress(goal.id, prog.id)}
                          >
                            削除
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {!addingProgress ||
                  addingProgress.goalId !== goal.id ? (
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() =>
                        setAddingProgress({
                          goalId: goal.id,
                          progressPercent: 0,
                          comment: "",
                          recordedDate: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" }),
                        })
                      }
                    >
                      進捗を追加
                    </button>
                  ) : (
                    <div className="stack-sm">
                      <div className="row" style={{ gap: "10px" }}>
                        <div className="field" style={{ flex: 1 }}>
                          <label className="label">進捗 (%)</label>
                          <input
                            type="number"
                            className="input"
                            min="0"
                            max="100"
                            value={addingProgress.progressPercent}
                            onChange={(e) =>
                              setAddingProgress({
                                ...addingProgress,
                                progressPercent: parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div className="field" style={{ flex: 1 }}>
                          <label className="label">記録日</label>
                          <input
                            type="date"
                            className="input"
                            value={addingProgress.recordedDate}
                            onChange={(e) =>
                              setAddingProgress({
                                ...addingProgress,
                                recordedDate: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="field">
                        <label className="label">コメント</label>
                        <textarea
                          className="textarea"
                          value={addingProgress.comment}
                          onChange={(e) =>
                            setAddingProgress({
                              ...addingProgress,
                              comment: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="row">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={handleAddProgress}
                          disabled={progressSubmitting}
                        >
                          {progressSubmitting ? "追加中..." : "追加"}
                        </button>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => setAddingProgress(null)}
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {goals.length === 0 && <div className="empty-state">目標がありません</div>}

          {editingGoal && (
            <div className="card">
              <div className="section-title">目標を編集</div>
              <div className="stack">
                <div className="field">
                  <label className="label">タイトル</label>
                  <input
                    type="text"
                    className="input"
                    value={editingGoal.title}
                    onChange={(e) =>
                      setEditingGoal({ ...editingGoal, title: e.target.value })
                    }
                  />
                </div>
                <div className="field">
                  <label className="label">説明</label>
                  <textarea
                    className="textarea"
                    value={editingGoal.description}
                    onChange={(e) =>
                      setEditingGoal({ ...editingGoal, description: e.target.value })
                    }
                  />
                </div>
                <div className="field">
                  <label className="label">開始日</label>
                  <input
                    type="date"
                    className="input"
                    value={editingGoal.startDate}
                    onChange={(e) =>
                      setEditingGoal({ ...editingGoal, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="field">
                  <label className="label">終了日</label>
                  <input
                    type="date"
                    className="input"
                    value={editingGoal.endDate}
                    onChange={(e) =>
                      setEditingGoal({ ...editingGoal, endDate: e.target.value })
                    }
                  />
                </div>
                <div className="row">
                  <button
                    className="btn btn-primary"
                    onClick={handleUpdateGoal}
                    disabled={editSubmitting}
                  >
                    {editSubmitting ? "更新中..." : "更新"}
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => setEditingGoal(null)}
                    disabled={editSubmitting}
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function GoalsPage() {
  return (
    <Suspense fallback={<div className="page spinner-page">読み込み中...</div>}>
      <GoalsPageContent />
    </Suspense>
  );
}
