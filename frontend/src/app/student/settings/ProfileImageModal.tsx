"use client";

import { useState } from "react";
import { ApiError, studentApi } from "@/lib/api";
import { convertHeicToJpeg } from "@/lib/image";
import { useToast } from "@/components/Toast";
import { Avatar } from "@/components/Avatar";

interface ProfileImageModalProps {
  currentImageUrl: string | null;
  name: string | null | undefined;
  onClose: () => void;
  onUpdated: (profileImageUrl: string | null) => void;
}

export function ProfileImageModal({ currentImageUrl, name, onClose, onUpdated }: ProfileImageModalProps) {
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    if (!selected) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    // HEIC はそのままではプレビューできない端末があるため JPEG に変換してから保持
    const converted = await convertHeicToJpeg(selected);
    setFile(converted);
    setPreviewUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return URL.createObjectURL(converted);
    });
  };

  const handleSave = async () => {
    if (!file) return;
    setSubmitting(true);
    try {
      const res = await studentApi.uploadProfileImage(file);
      onUpdated(res.profileImageUrl);
      showToast("プロフィール画像を更新しました");
      onClose();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "画像の更新に失敗しました";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const res = await studentApi.deleteProfileImage();
      onUpdated(res.profileImageUrl);
      showToast("プロフィール画像を削除しました");
      onClose();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "画像の削除に失敗しました";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ig-modal-backdrop" onClick={onClose}>
      <div className="ig-modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="ig-modal-title">プロフィール画像を変更</div>

        <div className="ig-modal-avatar-preview">
          {previewUrl ? (
            <img src={previewUrl} alt="" className="ig-profile-avatar-lg-photo" />
          ) : (
            <Avatar
              src={currentImageUrl}
              name={name}
              textClassName="ig-profile-avatar-lg"
              photoClassName="ig-profile-avatar-lg-photo"
            />
          )}
        </div>

        <input type="file" accept="image/*" onChange={handleFileChange} disabled={submitting} />

        <div className="ig-modal-actions">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={!file || submitting}
          >
            {submitting ? "保存中..." : "保存"}
          </button>
          {currentImageUrl && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleDelete}
              disabled={submitting}
            >
              削除
            </button>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={submitting}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
