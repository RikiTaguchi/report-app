"use client";

import { ChevronLeftIcon, DocumentIcon, PlusIcon } from "@/components/icons";

const MAX_IMAGES = 5;

export interface TeacherBlogFormImage {
  key: string;
  url: string;
}

export function TeacherBlogForm({
  title,
  content,
  images,
  error,
  submitting,
  submitLabel,
  onTitleChange,
  onContentChange,
  onSelectImages,
  onRemoveImage,
  onSubmit,
  onBack,
}: {
  title: string;
  content: string;
  images: TeacherBlogFormImage[];
  error: string | null;
  submitting: boolean;
  submitLabel: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSelectImages: (files: FileList | null) => void;
  onRemoveImage: (key: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const canSubmit = Boolean(title.trim() && content.trim()) && !submitting;

  return (
    <div className="page ig-report-form-page">
      <button
        type="button"
        className="ig-profile-back-button"
        onClick={onBack}
        aria-label="ブログ一覧へ戻る"
      >
        <ChevronLeftIcon />
        <span>ブログ一覧へ戻る</span>
      </button>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stack ig-settings-form">
        <div className="ig-settings-section">
          <div className="ig-settings-header">
            <PlusIcon />
            <h2 className="ig-settings-title">画像</h2>
          </div>
          <div className="image-row">
            {images.map((image, index) => (
              <div key={image.key} className="image-tile">
                <img src={image.url} alt={`プレビュー ${index + 1}`} />
                <button
                  className="remove-btn"
                  type="button"
                  onClick={() => onRemoveImage(image.key)}
                  disabled={submitting}
                  aria-label={`${index + 1}枚目の画像を削除`}
                >
                  ×
                </button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <div className="ig-add-photo-tile">
                <PlusIcon />
                <span>写真を追加</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={submitting}
                  onChange={(event) => {
                    onSelectImages(event.target.files);
                    event.target.value = "";
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="ig-settings-section">
          <div className="ig-settings-header">
            <DocumentIcon />
            <h2 className="ig-settings-title">タイトル</h2>
          </div>
          <input
            className="input"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="タイトルを入力"
            disabled={submitting}
          />
        </div>

        <div className="ig-settings-section">
          <div className="ig-settings-header">
            <DocumentIcon />
            <h2 className="ig-settings-title">本文</h2>
          </div>
          <textarea
            className="textarea ig-blog-body"
            value={content}
            onChange={(event) => onContentChange(event.target.value)}
            placeholder="伝えたいことを書きましょう"
            disabled={submitting}
          />
        </div>

        <div className="row" style={{ marginTop: "8px" }}>
          <button className="btn btn-primary" onClick={onSubmit} disabled={!canSubmit}>
            {submitting ? "処理中..." : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export { MAX_IMAGES as BLOG_MAX_IMAGES };
