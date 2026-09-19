"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { teacherApi, ApiError } from "@/lib/api";
import { ChevronLeftIcon, ListIcon, PlusIcon } from "@/components/icons";
import type { GoalFormRequest, GoalFormResponse } from "@/lib/types";

type DraftItem = GoalFormRequest["subtitles"][number]["items"][number] & { key: string };
type DraftSubtitle = Omit<GoalFormRequest["subtitles"][number], "items"> & { key: string; items: DraftItem[] };
type Draft = Omit<GoalFormRequest, "subtitles"> & { subtitles: DraftSubtitle[] };

function key() { return Math.random().toString(36).slice(2); }

function fromResponse(data: GoalFormResponse): Draft {
  return {
    title: data.title,
    description: data.description,
    startDate: data.startDate,
    endDate: data.endDate,
    subtitles: data.subtitles.map((subtitle) => ({
      ...subtitle,
      key: key(),
      items: subtitle.items.map((item) => ({ ...item, key: key() })),
    })),
  };
}

function emptyDraft(): Draft {
  return { title: "", description: "", startDate: "", endDate: "", subtitles: [] };
}

export function TeacherGoalForm({
  studentId,
  studentName,
  goalId,
  initial,
  loading = false,
}: {
  studentId: string;
  studentName?: string;
  goalId?: string;
  initial?: GoalFormResponse;
  loading?: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => initial ? fromResponse(initial) : emptyDraft());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const disabled = loading || saving;

  useEffect(() => {
    setDraft(initial ? fromResponse(initial) : emptyDraft());
    setError(null);
  }, [initial, studentId, goalId]);

  const isEditing = Boolean(goalId);
  const maxSubtitles = 5;
  const maxItemsPerSubtitle = 5;

  function updateSubtitle(index: number, patch: Partial<DraftSubtitle>) {
    setDraft((current) => ({
      ...current,
      subtitles: current.subtitles.map((item, i) => i === index ? { ...item, ...patch } : item),
    }));
  }

  function updateItem(subtitleIndex: number, itemIndex: number, patch: Partial<DraftItem>) {
    setDraft((current) => ({
      ...current,
      subtitles: current.subtitles.map((subtitle, i) => i === subtitleIndex
        ? { ...subtitle, items: subtitle.items.map((item, j) => j === itemIndex ? { ...item, ...patch } : item) }
        : subtitle),
    }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.title.trim() || !draft.startDate || !draft.endDate) {
      setError("タイトルと期間を入力してください");
      return;
    }
    if (draft.endDate < draft.startDate) {
      setError("終了日は開始日以降にしてください");
      return;
    }
    if (draft.subtitles.some((subtitle) => !subtitle.label.trim() || subtitle.items.some((item) => !item.label.trim()))) {
      setError("サブタイトルと項目の内容を入力してください");
      return;
    }
    if (!isEditing && draft.subtitles.length > maxSubtitles) {
      setError(`サブタイトルは${maxSubtitles}個まで登録できます`);
      return;
    }
    if (!isEditing && draft.subtitles.some((subtitle) => subtitle.items.length > maxItemsPerSubtitle)) {
      setError(`1つのサブタイトルにつき項目は${maxItemsPerSubtitle}個まで登録できます`);
      return;
    }

    const request: GoalFormRequest = {
      title: draft.title.trim(),
      description: draft.description?.trim() || null,
      startDate: draft.startDate,
      endDate: draft.endDate,
      subtitles: draft.subtitles.map(({ key: _key, items, ...subtitle }) => ({
        ...subtitle,
        label: subtitle.label.trim(),
        items: items.map(({ key: _itemKey, ...item }) => ({ ...item, label: item.label.trim() })),
      })),
    };

    try {
      setSaving(true);
      setError(null);
      if (goalId) await teacherApi.goalForms.update(studentId, goalId, request);
      else await teacherApi.goalForms.create(studentId, request);
      router.push(`/teacher/students/${studentId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "目標の保存に失敗しました");
      setSaving(false);
    }
  }

  return (
    <div className="page ig-goal-page ig-goal-form-page">
      <button
        type="button"
        className="ig-profile-back-button"
        onClick={() => router.push(`/teacher/students/${studentId}`)}
        aria-label="生徒詳細へ戻る"
      >
        <ChevronLeftIcon />
        <span>生徒詳細へ戻る</span>
      </button>
      {studentName && <p className="muted">対象生徒: {studentName}</p>}

      {error && <div className="alert alert-error" role="alert" aria-live="polite">{error}</div>}

      {loading ? <div className="spinner-page">読み込み中...</div> : (
        <form className="ig-goal-form" onSubmit={(event) => void save(event)}>
          <section className="ig-goal-form-section">
            <div className="field">
              <label className="label" htmlFor="goal-title">目標タイトル</label>
              <input
                id="goal-title"
                className="input"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="例：毎日英単語を30個覚える"
                disabled={disabled}
                required
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="goal-description">説明 <span className="muted">任意</span></label>
              <textarea
                id="goal-description"
                className="textarea"
                value={draft.description ?? ""}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="目標に取り組むときのポイントや補足"
                disabled={disabled}
              />
            </div>
            <div className="ig-goal-form-grid">
              <div className="field">
                <label className="label" htmlFor="goal-start-date">開始日</label>
                <input id="goal-start-date" className="input" type="date" value={draft.startDate} max={draft.endDate || undefined} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} disabled={disabled} required />
              </div>
              <div className="field">
                <label className="label" htmlFor="goal-end-date">終了日</label>
                <input id="goal-end-date" className="input" type="date" value={draft.endDate} min={draft.startDate || undefined} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} disabled={disabled} required />
              </div>
            </div>
          </section>

          <section className="ig-goal-form-section">
            <div className="ig-goal-form-section-header ig-goal-form-section-header-between">
              <div className="ig-goal-form-section-title-wrap">
                <ListIcon />
                <div>
                  <h2>レポート項目</h2>
                  <p>生徒が毎日の振り返りで確認する項目です</p>
                </div>
              </div>
              {!isEditing && (
                <button
                  className="ig-goal-add-button"
                  type="button"
                  onClick={() => {
                    if (draft.subtitles.length >= maxSubtitles) return;
                    setDraft({ ...draft, subtitles: [...draft.subtitles, { key: key(), label: "", items: [] }] });
                  }}
                  disabled={disabled || draft.subtitles.length >= maxSubtitles}
                >
                  <PlusIcon />
                  <span>サブタイトルを追加</span>
                </button>
              )}
            </div>

            {draft.subtitles.length === 0 && (
              <div className="ig-goal-form-empty">
                {isEditing ? "登録済みのサブタイトルがありません。" : `サブタイトルを追加して、目標に紐づく項目を作成しましょう。（最大${maxSubtitles}個）`}
              </div>
            )}

            <div className="ig-goal-subtitle-list-form">
              {draft.subtitles.map((subtitle, subtitleIndex) => (
                <fieldset className="ig-goal-subtitle-card" key={subtitle.key}>
                  <div className="ig-goal-subtitle-heading">
                    <div className="ig-goal-subtitle-number">{String(subtitleIndex + 1).padStart(2, "0")}</div>
                    <input
                      className="input"
                      value={subtitle.label}
                      placeholder="サブタイトル（例：毎日の学習）"
                      aria-label={`${subtitleIndex + 1}番目のサブタイトル`}
                      onChange={(e) => updateSubtitle(subtitleIndex, { label: e.target.value })}
                      disabled={disabled}
                      required
                    />
                    {!isEditing && (
                      <button
                        className="ig-goal-remove-button"
                        type="button"
                        onClick={() => setDraft({ ...draft, subtitles: draft.subtitles.filter((_, i) => i !== subtitleIndex) })}
                        disabled={disabled}
                        aria-label={`${subtitleIndex + 1}番目のサブタイトルを削除`}
                      >
                        削除
                      </button>
                    )}
                  </div>
                  <div className="ig-goal-item-list-form">
                    {subtitle.items.map((item, itemIndex) => (
                      <div className="ig-goal-item-row" key={item.key}>
                        <input
                          className="input"
                          value={item.label}
                          placeholder="項目の内容"
                          aria-label={`${subtitleIndex + 1}番目のサブタイトルの${itemIndex + 1}番目の項目内容`}
                          onChange={(e) => updateItem(subtitleIndex, itemIndex, { label: e.target.value })}
                          disabled={disabled}
                          required
                        />
                        {!isEditing && (
                          <button
                            className="ig-goal-remove-button ig-goal-remove-button-item"
                            type="button"
                            onClick={() => updateSubtitle(subtitleIndex, { items: subtitle.items.filter((_, i) => i !== itemIndex) })}
                            disabled={disabled}
                            aria-label={`${subtitleIndex + 1}番目のサブタイトルの${itemIndex + 1}番目の項目を削除`}
                          >
                            削除
                          </button>
                        )}
                      </div>
                    ))}
                    {!isEditing && (
                      <button
                        className="ig-goal-add-row-button"
                        type="button"
                        onClick={() => {
                          if (subtitle.items.length >= maxItemsPerSubtitle) return;
                          updateSubtitle(subtitleIndex, { items: [...subtitle.items, { key: key(), label: "" }] });
                        }}
                        disabled={disabled || subtitle.items.length >= maxItemsPerSubtitle}
                      >
                        <PlusIcon />
                        <span>項目を追加</span>
                      </button>
                    )}
                  </div>
                </fieldset>
              ))}
            </div>
          </section>

          <div className="ig-goal-form-actions">
            <button className="btn btn-primary ig-goal-save-button" type="submit" disabled={disabled}>
              {saving ? "保存中..." : goalId ? "変更を保存" : "目標を登録"}
            </button>
            <Link className="btn btn-ghost" href={`/teacher/students/${studentId}`}>キャンセル</Link>
          </div>
        </form>
      )}
    </div>
  );
}
