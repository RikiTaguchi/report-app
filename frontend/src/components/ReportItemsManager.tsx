"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  StudentResponse,
  GoalResponse,
  ReportItemGroupResponse,
  ReportItemSubtitleResponse,
  ReportItemDefinitionResponse,
} from "@/lib/types";

interface ReportItemGroupsApi {
  listGroups(studentId: string): Promise<ReportItemGroupResponse[]>;
  createGroup(
    studentId: string,
    req: { goalId: string }
  ): Promise<ReportItemGroupResponse>;
  deleteGroup(studentId: string, groupId: string): Promise<void>;
  listSubtitles(studentId: string, groupId: string): Promise<ReportItemSubtitleResponse[]>;
  createSubtitle(studentId: string, groupId: string, req: { label: string }): Promise<ReportItemSubtitleResponse>;
  updateSubtitle(studentId: string, groupId: string, subtitleId: string, req: { label: string }): Promise<ReportItemSubtitleResponse>;
  deleteSubtitle(studentId: string, groupId: string, subtitleId: string): Promise<void>;
  listItems(studentId: string, groupId: string, subtitleId: string): Promise<ReportItemDefinitionResponse[]>;
  createItem(
    studentId: string,
    groupId: string,
    subtitleId: string,
    req: { label: string }
  ): Promise<ReportItemDefinitionResponse>;
  updateItem(
    studentId: string,
    groupId: string,
    subtitleId: string,
    itemId: string,
    req: { label: string }
  ): Promise<ReportItemDefinitionResponse>;
  deleteItem(studentId: string, groupId: string, subtitleId: string, itemId: string): Promise<void>;
  reorderItems(
    studentId: string,
    groupId: string,
    subtitleId: string,
    req: { orderedIds: string[] }
  ): Promise<void>;
}

interface ReportItemsManagerProps {
  listStudents(): Promise<StudentResponse[]>;
  goals: { list(studentId: string): Promise<GoalResponse[]> };
  reportItemGroups: ReportItemGroupsApi;
  initialStudentId?: string;
}

function errMsg(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

function SortableItemRow({
  item,
  onEdit,
  onDelete,
  disabled,
}: {
  item: ReportItemDefinitionResponse;
  onEdit: () => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  return (
    <div
      ref={setNodeRef}
      className="row-between"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        padding: "6px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="row" style={{ alignItems: "center", gap: 8 }}>
        <span
          {...attributes}
          {...listeners}
          style={{ cursor: "grab", color: "var(--muted)", fontSize: "1.1rem", touchAction: "none" }}
        >
          ⠿
        </span>
        <span>{item.label}</span>
      </div>
      <div className="row">
        <button className="btn btn-ghost btn-sm" onClick={onEdit} disabled={disabled}>
          編集
        </button>
        <button className="btn btn-danger btn-sm" onClick={onDelete} disabled={disabled}>
          削除
        </button>
      </div>
    </div>
  );
}

function ItemTypeList({
  title,
  items,
  submitting,
  onReorder,
  onStartEdit,
  onDelete,
  editingId,
  editingLabel,
  onEditingLabelChange,
  onSaveEdit,
  onCancelEdit,
  newLabel,
  onNewLabelChange,
  onCreate,
}: {
  title: string;
  items: ReportItemDefinitionResponse[];
  submitting: boolean;
  onReorder: (orderedIds: string[]) => void;
  onStartEdit: (item: ReportItemDefinitionResponse) => void;
  onDelete: (item: ReportItemDefinitionResponse) => void;
  editingId: string | null;
  editingLabel: string;
  onEditingLabelChange: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  newLabel: string;
  onNewLabelChange: (v: string) => void;
  onCreate: () => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const ids = items.map((i) => i.id);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(ids, oldIndex, newIndex));
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div className="label" style={{ marginBottom: 6 }}>
        {title}
      </div>
      {items.length === 0 ? (
        <div className="muted" style={{ fontSize: "0.85rem" }}>
          項目がありません
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {items.map((item) =>
              editingId === item.id ? (
                <div key={item.id} className="row" style={{ padding: "6px 0" }}>
                  <input
                    className="input"
                    value={editingLabel}
                    onChange={(e) => onEditingLabelChange(e.target.value)}
                    disabled={submitting}
                  />
                  <button className="btn btn-primary btn-sm" onClick={onSaveEdit} disabled={submitting}>
                    保存
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={onCancelEdit} disabled={submitting}>
                    キャンセル
                  </button>
                </div>
              ) : (
                <SortableItemRow
                  key={item.id}
                  item={item}
                  onEdit={() => onStartEdit(item)}
                  onDelete={() => onDelete(item)}
                  disabled={submitting}
                />
              )
            )}
          </SortableContext>
        </DndContext>
      )}

      <div className="row" style={{ marginTop: 8 }}>
        <input
          className="input"
          placeholder="例: 朝勉強した"
          value={newLabel}
          onChange={(e) => onNewLabelChange(e.target.value)}
          disabled={submitting}
        />
        <button
          className="btn btn-ghost btn-sm"
          onClick={onCreate}
          disabled={submitting || !newLabel.trim()}
        >
          追加
        </button>
      </div>
    </div>
  );
}

export function ReportItemsManager({
  listStudents,
  goals,
  reportItemGroups,
  initialStudentId,
}: ReportItemsManagerProps) {
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentGoals, setStudentGoals] = useState<GoalResponse[]>([]);
  const [groups, setGroups] = useState<ReportItemGroupResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudentData, setLoadingStudentData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [subtitles, setSubtitles] = useState<ReportItemSubtitleResponse[]>([]);
  const [loadingSubtitles, setLoadingSubtitles] = useState(false);
  const [newSubtitleLabel, setNewSubtitleLabel] = useState("");
  const [editingSubtitleId, setEditingSubtitleId] = useState<string | null>(null);
  const [editingSubtitleLabel, setEditingSubtitleLabel] = useState("");

  const [expandedSubtitleId, setExpandedSubtitleId] = useState<string | null>(null);
  const [itemsBySubtitle, setItemsBySubtitle] = useState<Record<string, ReportItemDefinitionResponse[]>>({});
  const [loadingItemsSubtitleId, setLoadingItemsSubtitleId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemLabel, setEditingItemLabel] = useState("");
  const [newCheckboxLabel, setNewCheckboxLabel] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const data = await listStudents();
        setStudents(data);
        if (initialStudentId && data.some((s) => s.id === initialStudentId)) {
          setSelectedStudentId(initialStudentId);
        } else if (data.length > 0) {
          setSelectedStudentId(data[0].id);
        }
      } catch (err) {
        setError(errMsg(err, "生徒一覧の読み込みに失敗しました"));
      } finally {
        setLoading(false);
      }
    })();
  }, [listStudents, initialStudentId]);

  useEffect(() => {
    if (!selectedStudentId) return;
    setSelectedGroupId(null);
    setSubtitles([]);
    setItemsBySubtitle({});
    setExpandedSubtitleId(null);
    (async () => {
      setLoadingStudentData(true);
      setError(null);
      try {
        const [goalsData, groupsData] = await Promise.all([
          goals.list(selectedStudentId),
          reportItemGroups.listGroups(selectedStudentId),
        ]);
        setStudentGoals(goalsData);
        setGroups(groupsData);
      } catch (err) {
        setError(errMsg(err, "データの読み込みに失敗しました"));
      } finally {
        setLoadingStudentData(false);
      }
    })();
  }, [selectedStudentId, goals, reportItemGroups]);

  async function loadSubtitles(groupId: string) {
    setLoadingSubtitles(true);
    setError(null);
    try {
      const data = await reportItemGroups.listSubtitles(selectedStudentId, groupId);
      setSubtitles(data);
    } catch (err) {
      setError(errMsg(err, "サブタイトルの読み込みに失敗しました"));
    } finally {
      setLoadingSubtitles(false);
    }
  }

  async function handleOpenGroup(groupId: string) {
    setSelectedGroupId(groupId);
    setExpandedSubtitleId(null);
    await loadSubtitles(groupId);
  }

  async function handleCreateGroup(goalId: string) {
    setSubmitting(true);
    setError(null);
    try {
      const created = await reportItemGroups.createGroup(selectedStudentId, { goalId });
      setGroups([...groups, created]);
      await handleOpenGroup(created.id);
    } catch (err) {
      setError(errMsg(err, "グループの作成に失敗しました"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteGroup(groupId: string) {
    if (!confirm("この日報項目グループを削除しますか？（既に回答が存在する場合は削除できません）")) return;
    setSubmitting(true);
    setError(null);
    try {
      await reportItemGroups.deleteGroup(selectedStudentId, groupId);
      setGroups(groups.filter((g) => g.id !== groupId));
      if (selectedGroupId === groupId) {
        setSelectedGroupId(null);
        setSubtitles([]);
      }
    } catch (err) {
      setError(errMsg(err, "グループの削除に失敗しました"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateSubtitle() {
    if (!selectedGroupId || !newSubtitleLabel.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await reportItemGroups.createSubtitle(selectedStudentId, selectedGroupId, {
        label: newSubtitleLabel,
      });
      setSubtitles([...subtitles, created]);
      setNewSubtitleLabel("");
    } catch (err) {
      setError(errMsg(err, "サブタイトルの作成に失敗しました"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveSubtitle() {
    if (!selectedGroupId || !editingSubtitleId) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await reportItemGroups.updateSubtitle(selectedStudentId, selectedGroupId, editingSubtitleId, {
        label: editingSubtitleLabel,
      });
      setSubtitles(subtitles.map((s) => (s.id === editingSubtitleId ? updated : s)));
      setEditingSubtitleId(null);
    } catch (err) {
      setError(errMsg(err, "サブタイトルの更新に失敗しました"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteSubtitle(subtitleId: string) {
    if (!selectedGroupId || !confirm("このサブタイトルを削除しますか？（既に回答が存在する項目を含む場合は削除できません）")) return;
    setSubmitting(true);
    setError(null);
    try {
      await reportItemGroups.deleteSubtitle(selectedStudentId, selectedGroupId, subtitleId);
      setSubtitles(subtitles.filter((s) => s.id !== subtitleId));
      if (expandedSubtitleId === subtitleId) setExpandedSubtitleId(null);
    } catch (err) {
      setError(errMsg(err, "サブタイトルの削除に失敗しました"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleExpandSubtitle(subtitleId: string) {
    if (expandedSubtitleId === subtitleId) {
      setExpandedSubtitleId(null);
      return;
    }
    setExpandedSubtitleId(subtitleId);
    if (itemsBySubtitle[subtitleId] || !selectedGroupId) return;
    setLoadingItemsSubtitleId(subtitleId);
    setError(null);
    try {
      const items = await reportItemGroups.listItems(selectedStudentId, selectedGroupId, subtitleId);
      setItemsBySubtitle((prev) => ({ ...prev, [subtitleId]: items }));
    } catch (err) {
      setError(errMsg(err, "項目の読み込みに失敗しました"));
    } finally {
      setLoadingItemsSubtitleId(null);
    }
  }

  async function handleCreateItem(subtitleId: string) {
    if (!selectedGroupId) return;
    const label = newCheckboxLabel[subtitleId];
    if (!label?.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await reportItemGroups.createItem(selectedStudentId, selectedGroupId, subtitleId, { label });
      setItemsBySubtitle((prev) => ({
        ...prev,
        [subtitleId]: [...(prev[subtitleId] ?? []), created],
      }));
      setNewCheckboxLabel((prev) => ({ ...prev, [subtitleId]: "" }));
    } catch (err) {
      setError(errMsg(err, "項目の作成に失敗しました"));
    } finally {
      setSubmitting(false);
    }
  }

  function handleStartEditItem(item: ReportItemDefinitionResponse) {
    setEditingItemId(item.id);
    setEditingItemLabel(item.label);
  }

  async function handleSaveEditItem(subtitleId: string, item: ReportItemDefinitionResponse) {
    if (!selectedGroupId) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await reportItemGroups.updateItem(selectedStudentId, selectedGroupId, subtitleId, item.id, {
        label: editingItemLabel,
      });
      setItemsBySubtitle((prev) => ({
        ...prev,
        [subtitleId]: (prev[subtitleId] ?? []).map((i) => (i.id === item.id ? updated : i)),
      }));
      setEditingItemId(null);
    } catch (err) {
      setError(errMsg(err, "項目の更新に失敗しました"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteItem(subtitleId: string, item: ReportItemDefinitionResponse) {
    if (!selectedGroupId || !confirm("この項目を削除しますか？（既に回答が存在する場合は削除できません）")) return;
    setSubmitting(true);
    setError(null);
    try {
      await reportItemGroups.deleteItem(selectedStudentId, selectedGroupId, subtitleId, item.id);
      setItemsBySubtitle((prev) => ({
        ...prev,
        [subtitleId]: (prev[subtitleId] ?? []).filter((i) => i.id !== item.id),
      }));
    } catch (err) {
      setError(errMsg(err, "項目の削除に失敗しました"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReorder(subtitleId: string, orderedIds: string[]) {
    if (!selectedGroupId) return;
    const current = itemsBySubtitle[subtitleId] ?? [];
    const byId = new Map(current.map((i) => [i.id, i]));
    const merged = orderedIds.map((id) => byId.get(id)!).filter(Boolean);
    setItemsBySubtitle((prev) => ({ ...prev, [subtitleId]: merged }));
    try {
      await reportItemGroups.reorderItems(selectedStudentId, selectedGroupId, subtitleId, { orderedIds });
    } catch (err) {
      setError(errMsg(err, "並び替えの保存に失敗しました"));
      try {
        const items = await reportItemGroups.listItems(selectedStudentId, selectedGroupId, subtitleId);
        setItemsBySubtitle((prev) => ({ ...prev, [subtitleId]: items }));
      } catch {
        // ignore resync failure
      }
    }
  }

  if (loading) {
    return <div className="spinner-page">読み込み中...</div>;
  }

  const goalsWithoutGroup = studentGoals.filter((g) => !groups.some((gr) => gr.goalId === g.id));
  const selectedGroup = groups.find((g) => g.id === selectedGroupId) || null;

  return (
    <div className="page">
      <div className="page-header">
        <h1>日報項目管理</h1>
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

      {loadingStudentData ? (
        <div className="spinner-page">読み込み中...</div>
      ) : (
        <>
          <div className="card">
            <div className="section-title">目標ごとの日報項目グループ</div>
            {studentGoals.length === 0 ? (
              <div className="empty-state">この生徒には目標が登録されていません。先に目標を作成してください。</div>
            ) : (
              <div className="stack">
                {studentGoals.map((goal) => {
                  const group = groups.find((g) => g.goalId === goal.id);
                  return (
                    <div key={goal.id} className="row-between" style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                      <div className="stack-sm">
                        <div className="row" style={{ gap: 8, alignItems: "center" }}>
                          <span style={{ fontWeight: 600 }}>{goal.title}</span>
                          {goal.isCurrent && <span className="badge badge-success">現在</span>}
                        </div>
                        <div className="muted" style={{ fontSize: "0.8rem" }}>
                          {new Date(goal.startDate).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })} 〜{" "}
                          {new Date(goal.endDate).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                        </div>
                      </div>
                      {group ? (
                        <div className="row">
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleOpenGroup(group.id)}
                            disabled={submitting}
                          >
                            {selectedGroupId === group.id ? "選択中" : "詳細を開く"}
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteGroup(group.id)}
                            disabled={submitting}
                          >
                            削除
                          </button>
                        </div>
                      ) : (
                        <div className="stack-sm" style={{ minWidth: 220 }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleCreateGroup(goal.id)}
                            disabled={submitting}
                          >
                            日報項目グループを作成
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {goalsWithoutGroup.length === 0 && studentGoals.length > 0 && (
              <div className="muted" style={{ fontSize: "0.8rem", marginTop: 8 }}>
                すべての目標にグループが作成済みです
              </div>
            )}
          </div>

          {selectedGroup && (
            <div className="card">
              <div className="row-between">
                <div className="section-title">{selectedGroup.goalTitle} の日報項目</div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedGroupId(null)}>
                  閉じる
                </button>
              </div>

              {loadingSubtitles ? (
                <div className="spinner-page">読み込み中...</div>
              ) : (
                <div className="stack">
                  {subtitles.map((subtitle) => (
                    <div key={subtitle.id} className="card" style={{ background: "var(--surface-alt, transparent)" }}>
                      <div className="row-between">
                        {editingSubtitleId === subtitle.id ? (
                          <div className="row" style={{ flex: 1 }}>
                            <input
                              className="input"
                              value={editingSubtitleLabel}
                              onChange={(e) => setEditingSubtitleLabel(e.target.value)}
                              disabled={submitting}
                            />
                            <button className="btn btn-primary btn-sm" onClick={handleSaveSubtitle} disabled={submitting}>
                              保存
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => setEditingSubtitleId(null)}
                              disabled={submitting}
                            >
                              キャンセル
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-ghost"
                            onClick={() => handleExpandSubtitle(subtitle.id)}
                            style={{ flex: 1, textAlign: "left", justifyContent: "flex-start" }}
                          >
                            {expandedSubtitleId === subtitle.id ? "▼ " : "▶ "}
                            {subtitle.label}
                          </button>
                        )}
                        {editingSubtitleId !== subtitle.id && (
                          <div className="row">
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                setEditingSubtitleId(subtitle.id);
                                setEditingSubtitleLabel(subtitle.label);
                              }}
                              disabled={submitting}
                            >
                              編集
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteSubtitle(subtitle.id)}
                              disabled={submitting}
                            >
                              削除
                            </button>
                          </div>
                        )}
                      </div>

                      {expandedSubtitleId === subtitle.id && (
                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                          {loadingItemsSubtitleId === subtitle.id ? (
                            <div className="spinner-page">読み込み中...</div>
                          ) : (
                            <>
                              <ItemTypeList
                                title="チェック項目"
                                items={itemsBySubtitle[subtitle.id] ?? []}
                                submitting={submitting}
                                onReorder={(orderedIds) => handleReorder(subtitle.id, orderedIds)}
                                onStartEdit={handleStartEditItem}
                                onDelete={(item) => handleDeleteItem(subtitle.id, item)}
                                editingId={editingItemId}
                                editingLabel={editingItemLabel}
                                onEditingLabelChange={setEditingItemLabel}
                                onSaveEdit={() => {
                                  const item = (itemsBySubtitle[subtitle.id] ?? []).find((i) => i.id === editingItemId);
                                  if (item) handleSaveEditItem(subtitle.id, item);
                                }}
                                onCancelEdit={() => setEditingItemId(null)}
                                newLabel={newCheckboxLabel[subtitle.id] ?? ""}
                                onNewLabelChange={(v) => setNewCheckboxLabel((prev) => ({ ...prev, [subtitle.id]: v }))}
                                onCreate={() => handleCreateItem(subtitle.id)}
                              />
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="row" style={{ marginTop: 8 }}>
                    <input
                      className="input"
                      placeholder="新しいサブタイトル"
                      value={newSubtitleLabel}
                      onChange={(e) => setNewSubtitleLabel(e.target.value)}
                      disabled={submitting}
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleCreateSubtitle}
                      disabled={submitting || !newSubtitleLabel.trim()}
                    >
                      サブタイトルを追加
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
