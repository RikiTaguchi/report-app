"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { teacherApi, ApiError, resolveFileUrl } from "@/lib/api";
import type { BlogImageResponse, BlogResponse } from "@/lib/types";

const MAX_IMAGES = 5;

interface Params {
  blogId: string;
}

export default function EditBlogPage({ params }: { params: Promise<Params> }) {
  const { blogId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [blog, setBlog] = useState<BlogResponse | null>(null);
  const [images, setImages] = useState<BlogImageResponse[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [blogData, imagesData] = await Promise.all([
          teacherApi.getBlog(blogId),
          teacherApi.listBlogImages(blogId),
        ]);
        setBlog(blogData);
        setTitle(blogData.title);
        setContent(blogData.content);
        setImages(imagesData);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("ブログの読み込みに失敗しました");
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [blogId]);

  if (loading) {
    return <div className="spinner-page">読み込み中...</div>;
  }

  if (!blog) {
    return (
      <div className="page">
        <div className="empty-state">ブログが見つかりません</div>
      </div>
    );
  }

  if (blog.teacherId !== user?.id) {
    return (
      <div className="page">
        <div className="alert alert-error">このブログを編集する権限がありません</div>
        <Link href="/teacher/blogs" className="btn btn-ghost">
          戻る
        </Link>
      </div>
    );
  }

  async function handleSave() {
    if (!title.trim() || !content.trim()) return;

    try {
      setSubmitting(true);
      const updated = await teacherApi.updateBlog(blogId, { title, content });
      setBlog(updated);
      router.push(`/teacher/blogs/${blogId}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("ブログの保存に失敗しました");
      }
      setSubmitting(false);
    }
  }

  async function handleUploadImage(file: File) {
    if (images.length >= MAX_IMAGES) {
      setError(`画像は最大${MAX_IMAGES}枚までです`);
      return;
    }
    try {
      const newImage = await teacherApi.uploadBlogImage(blogId, file);
      setImages([...images, newImage]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "画像アップロードに失敗しました");
    }
  }

  async function handleDeleteImage(imageId: string) {
    if (!confirm("画像を削除してよろしいですか？")) return;
    try {
      await teacherApi.deleteBlogImage(blogId, imageId);
      setImages(images.filter((img) => img.id !== imageId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "削除に失敗しました");
    }
  }

  return (
    <div className="page">
      <div className="breadcrumb">
        <Link href="/teacher/blogs">ブログ</Link>
        <span>/</span>
        <Link href={`/teacher/blogs/${blogId}`}>{blog.title}</Link>
        <span>/</span>
        <span>編集</span>
      </div>

      <div className="page-header">
        <h1>編集</h1>
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
              disabled={submitting}
            />
          </div>

          <div className="field">
            <label className="label">本文</label>
            <textarea
              className="textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
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
                disabled={submitting}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleUploadImage(e.target.files[0]);
                    e.target.value = "";
                  }
                }}
              />
            )}
            {images.length > 0 && (
              <div className="image-grid">
                {images.map((img) => (
                  <div key={img.id} className="image-tile">
                    <img src={resolveFileUrl(img.imageUrl)} alt="Blog image" />
                    <button
                      className="remove-btn"
                      type="button"
                      onClick={() => handleDeleteImage(img.id)}
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
              onClick={handleSave}
              disabled={submitting || !title.trim() || !content.trim()}
            >
              {submitting ? "保存中..." : "保存"}
            </button>
            <Link href={`/teacher/blogs/${blogId}`} className="btn btn-ghost">
              キャンセル
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
