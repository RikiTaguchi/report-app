"use client";

export function TeacherBlogActionsModal({
  title,
  submitting,
  onEdit,
  onDelete,
  onClose,
}: {
  title: string;
  submitting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <div className="ig-modal-backdrop" onClick={onClose}>
      <div className="ig-modal-panel ig-action-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="ig-modal-title">{title}</div>
        <div className="ig-action-sheet-list">
          <button type="button" className="ig-action-sheet-item" onClick={onEdit} disabled={submitting}>
            編集
          </button>
          <button
            type="button"
            className="ig-action-sheet-item ig-action-sheet-item-danger"
            onClick={onDelete}
            disabled={submitting}
          >
            {submitting ? "削除中..." : "削除"}
          </button>
          <button type="button" className="ig-action-sheet-item" onClick={onClose} disabled={submitting}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
