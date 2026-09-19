"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminApi, ApiError } from "@/lib/api";
import type { GoalFormRequest, GoalFormResponse } from "@/lib/types";

type DraftItem = GoalFormRequest["subtitles"][number]["items"][number] & { key: string };
type DraftSubtitle = Omit<GoalFormRequest["subtitles"][number], "items"> & { key: string; items: DraftItem[] };
type Draft = Omit<GoalFormRequest, "subtitles"> & { subtitles: DraftSubtitle[] };

function key() {
  return Math.random().toString(36).slice(2);
}

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

export function AdminGoalForm({
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
  const [draft, setDraft] = useState<Draft>(() => (initial ? fromResponse(initial) : emptyDraft()));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const disabled = loading || saving;
  const isEditing = Boolean(goalId);
  const maxSubtitles = 5;
  const maxItemsPerSubtitle = 5;
  const backHref = `/admin/students/${studentId}`;

  useEffect(() => {
    setDraft(initial ? fromResponse(initial) : emptyDraft());
    setError(null);
  }, [initial, studentId, goalId]);

  function updateSubtitle(index: number, patch: Partial<DraftSubtitle>) {
    setDraft((current) => ({
      ...current,
      subtitles: current.subtitles.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  }

  function updateItem(subtitleIndex: number, itemIndex: number, patch: Partial<DraftItem>) {
    setDraft((current) => ({
      ...current,
      subtitles: current.subtitles.map((subtitle, i) =>
        i === subtitleIndex
          ? { ...subtitle, items: subtitle.items.map((item, j) => (j === itemIndex ? { ...item, ...patch } : item)) }
          : subtitle
      ),
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
      if (goalId) await adminApi.goalForms.update(studentId, goalId, request);
      else await adminApi.goalForms.create(studentId, request);
      router.push(backHref);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "目標の保存に失敗しました");
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{goalId ? "目標を編集" : "目標を追加"}</h1>
        <Link href={backHref} className="btn btn-ghost btn-sm">生徒詳細へ戻る</Link>
      </div>
      {studentName && <p className="muted">対象生徒: {studentName}</p>}
      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <div className="spinner-page">読み込み中...</div>
      ) : (
        <form className="card stack" onSubmit={(event) => void save(event)}>
          <div className="field">
            <label className="label" htmlFor="admin-goal-title">目標タイトル</label>
            <input id="admin-goal-title" className="input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} disabled={disabled} required />
          </div>
          <div className="field">
            <label className="label" htmlFor="admin-goal-description">説明</label>
            <textarea id="admin-goal-description" className="textarea" value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} disabled={disabled} />
          </div>
          <div className="admin-form-grid">
            <div className="field">
              <label className="label">開始日</label>
              <input className="input" type="date" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} disabled={disabled} required />
            </div>
            <div className="field">
              <label className="label">終了日</label>
              <input className="input" type="date" value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} disabled={disabled} required />
            </div>
          </div>

          <div className="row-between">
            <div className="section-title">レポート項目</div>
            {!isEditing && (
              <button
                className="btn btn-sm btn-ghost"
                type="button"
                disabled={disabled || draft.subtitles.length >= maxSubtitles}
                onClick={() => setDraft({ ...draft, subtitles: [...draft.subtitles, { key: key(), label: "", items: [] }] })}
              >
                サブタイトルを追加
              </button>
            )}
          </div>

          {draft.subtitles.map((subtitle, subtitleIndex) => (
            <fieldset key={subtitle.key} className="admin-subtitle-card">
              <div className="admin-item-row">
                <input
                  className="input"
                  value={subtitle.label}
                  placeholder="サブタイトル"
                  onChange={(e) => updateSubtitle(subtitleIndex, { label: e.target.value })}
                  disabled={disabled}
                  required
                />
                {!isEditing && (
                  <button
                    className="btn btn-sm btn-ghost"
                    type="button"
                    onClick={() => setDraft({ ...draft, subtitles: draft.subtitles.filter((_, i) => i !== subtitleIndex) })}
                  >
                    削除
                  </button>
                )}
              </div>
              {subtitle.items.map((item, itemIndex) => (
                <div className="admin-item-row" key={item.key}>
                  <input
                    className="input"
                    value={item.label}
                    placeholder="項目"
                    onChange={(e) => updateItem(subtitleIndex, itemIndex, { label: e.target.value })}
                    disabled={disabled}
                    required
                  />
                  {!isEditing && (
                    <button
                      className="btn btn-sm btn-ghost"
                      type="button"
                      onClick={() => updateSubtitle(subtitleIndex, { items: subtitle.items.filter((_, i) => i !== itemIndex) })}
                    >
                      削除
                    </button>
                  )}
                </div>
              ))}
              {!isEditing && (
                <button
                  className="btn btn-sm btn-ghost"
                  type="button"
                  disabled={disabled || subtitle.items.length >= maxItemsPerSubtitle}
                  onClick={() => updateSubtitle(subtitleIndex, { items: [...subtitle.items, { key: key(), label: "" }] })}
                >
                  項目を追加
                </button>
              )}
            </fieldset>
          ))}

          <div className="row">
            <button className="btn btn-primary" type="submit" disabled={disabled}>
              {saving ? "保存中..." : goalId ? "変更を保存" : "目標を登録"}
            </button>
            <Link className="btn btn-ghost" href={backHref}>キャンセル</Link>
          </div>
        </form>
      )}
    </div>
  );
}
