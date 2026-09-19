"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { teacherApi, ApiError } from "@/lib/api";

const MAX_IMAGES = 5;

export default function NewBlogPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleSelectImages(files: FileList | null) {
    if (!files) return;
    const selected = Array.from(files);
    if (images.length + selected.length > MAX_IMAGES) {
      setError(`画像は最大${MAX_IMAGES}枚までです`);
      return;
    }
    setImages([...images, ...selected]);
  }

  function handleRemoveImage(index: number) {
    setImages(images.filter((_, i) => i !== index));
  }

  async function handleCreate(publish: boolean) {
    if (!title.trim() || !content.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      const blog = await teacherApi.createBlog({ title, content });
      for (const file of images) {
        await teacherApi.uploadBlogImage(blog.id, file);
      }
      if (publish) {
        await teacherApi.publishBlog(blog.id);
      }
      router.push(`/teacher/blogs/${blog.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("ブログの作成に失敗しました");
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="breadcrumb">
        <Link href="/teacher/blogs">ブログ</Link>
        <span>/</span>
        <span>新規作成</span>
      </div>

      <div className="page-header">
        <h1>新規作成</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="stack">
          <div className="field">
            <label className="label">タイトル</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タイトルを入力"
              disabled={submitting}
            />
          </div>

          <div className="field">
            <label className="label">本文</label>
            <textarea
              className="textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="本文を入力"
              disabled={submitting}
              style={{ minHeight: "300px" }}
            />
          </div>

          <div className="field">
            <label className="label">画像（{images.length}/{MAX_IMAGES}）</label>
            {images.length < MAX_IMAGES && (
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={submitting}
                onChange={(e) => {
                  handleSelectImages(e.target.files);
                  e.target.value = "";
                }}
              />
            )}
            {images.length > 0 && (
              <div className="image-grid">
                {images.map((file, index) => (
                  <div key={index} className="image-tile">
                    <img src={URL.createObjectURL(file)} alt="preview" />
                    <button
                      className="remove-btn"
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      disabled={submitting}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="row">
            <button
              className="btn btn-primary"
              onClick={() => handleCreate(false)}
              disabled={submitting || !title.trim() || !content.trim()}
            >
              {submitting ? "作成中..." : "下書きで作成"}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handleCreate(true)}
              disabled={submitting || !title.trim() || !content.trim()}
            >
              {submitting ? "作成中..." : "公開する"}
            </button>
            <Link href="/teacher/blogs" className="btn btn-ghost">
              キャンセル
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
