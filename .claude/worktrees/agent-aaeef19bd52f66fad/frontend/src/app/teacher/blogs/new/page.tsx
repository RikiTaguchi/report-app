"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { teacherApi, ApiError } from "@/lib/api";
import { PlusIcon } from "@/components/icons";

const MAX_IMAGES = 5;

export default function NewBlogPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const nextPreviews = images.map((file) => URL.createObjectURL(file));
    setPreviews(nextPreviews);
    return () => nextPreviews.forEach((url) => URL.revokeObjectURL(url));
  }, [images]);

  function handleSelectImages(files: FileList | null) {
    if (!files) return;
    const selected = Array.from(files);
    if (images.length + selected.length > MAX_IMAGES) {
      setError(`画像は最大${MAX_IMAGES}枚までです`);
      return;
    }
    setError(null);
    setImages((current) => [...current, ...selected]);
  }

  function handleRemoveImage(index: number) {
    setImages((current) => current.filter((_, i) => i !== index));
  }

  async function handleCreate(publish: boolean) {
    if (!title.trim() || !content.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      const blog = await teacherApi.createBlog({ title: title.trim(), content: content.trim() });
      for (const file of images) await teacherApi.uploadBlogImage(blog.id, file);
      if (publish) await teacherApi.publishBlog(blog.id);
      router.push(`/teacher/blogs/${blog.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ブログの作成に失敗しました");
      setSubmitting(false);
    }
  }

  const canSubmit = Boolean(title.trim() && content.trim()) && !submitting;

  return (
    <div className="page">
      <div className="breadcrumb">
        <Link href="/teacher/blogs">ブログ</Link>
        <span>/</span>
        <span>新規作成</span>
      </div>

      <div className="page-header">
        <div>
          <h1>ブログを作成</h1>
          <div className="muted" style={{ marginTop: "4px" }}>講師からのメッセージを届けましょう</div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="ig-card">
        <div className="ig-card-header">
          <div className="ig-avatar"><PlusIcon /></div>
          <div className="ig-card-header-main">
            <div className="ig-card-header-title">新しいブログ</div>
            <div className="ig-card-header-sub">画像と本文を入力して投稿できます</div>
          </div>
        </div>

        <div className="ig-card-body" style={{ paddingTop: "12px" }}>
          <div className="field">
            <label className="label" htmlFor="blog-title">タイトル</label>
            <input
              id="blog-title"
              className="input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="タイトルを入力"
              disabled={submitting}
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="blog-content">本文</label>
            <textarea
              id="blog-content"
              className="textarea"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="伝えたいことを書きましょう"
              disabled={submitting}
              style={{ minHeight: "300px", lineHeight: "1.7" }}
            />
          </div>

          <div className="field">
            <div className="row-between">
              <label className="label" htmlFor="blog-images">画像</label>
              <span className="muted" style={{ fontSize: "0.8rem" }}>{images.length}/{MAX_IMAGES}</span>
            </div>
            {images.length < MAX_IMAGES && (
              <input
                id="blog-images"
                type="file"
                accept="image/*"
                multiple
                disabled={submitting}
                onChange={(event) => {
                  handleSelectImages(event.target.files);
                  event.target.value = "";
                }}
              />
            )}
            {images.length > 0 && (
              <div className="image-grid">
                {previews.map((preview, index) => (
                  <div key={`${preview}-${index}`} className="image-tile">
                    <img src={preview} alt={`プレビュー ${index + 1}`} />
                    <button
                      className="remove-btn"
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      disabled={submitting}
                      aria-label={`${index + 1}枚目の画像を削除`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="row">
            <button className="btn btn-primary" onClick={() => handleCreate(false)} disabled={!canSubmit}>
              {submitting ? "作成中..." : "下書きで作成"}
            </button>
            <button className="btn btn-primary" onClick={() => handleCreate(true)} disabled={!canSubmit}>
              {submitting ? "作成中..." : "公開する"}
            </button>
            <Link href="/teacher/blogs" className="btn btn-ghost">キャンセル</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
