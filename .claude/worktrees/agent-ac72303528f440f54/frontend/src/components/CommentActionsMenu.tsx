"use client";

import { useEffect, useRef, useState } from "react";
import { EllipsisIcon } from "@/components/icons";

export function CommentActionsMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="ig-comment-menu" ref={ref}>
      <button
        type="button"
        className="ig-comment-menu-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="コメントメニュー"
      >
        <EllipsisIcon />
      </button>
      {open && (
        <div className="ig-comment-menu-popover">
          <button
            type="button"
            className="ig-comment-menu-item"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            編集
          </button>
          <button
            type="button"
            className="ig-comment-menu-item"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            削除
          </button>
        </div>
      )}
    </div>
  );
}
