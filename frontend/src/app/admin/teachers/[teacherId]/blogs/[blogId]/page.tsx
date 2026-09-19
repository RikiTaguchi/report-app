"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminApi, ApiError, resolveFileUrl } from "@/lib/api";
import type { BlogImageResponse, BlogResponse } from "@/lib/types";

export default function AdminBlogMonitorPage({
  params,
}: {
  params: Promise<{ teacherId: string; blogId: string }>;
}) {
  const router = useRouter();
  const [teacherId, setTeacherId] = useState("");
  const [blogId, setBlogId] = useState("");
  const [blog, setBlog] = useState<BlogResponse | null>(null);
  const [images, setImages] = useState<BlogImageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((value) => {
      setTeacherId(value.teacherId);
      setBlogId(value.blogId);
    });
  }, [params]);

  useEffect(() => {
    if (!blogId) return;
    Promise.all([adminApi.getBlog(blogId), adminApi.listBlogImages(blogId)])
      .then(([blogData, imageList]) => {
        setBlog(blogData);
        setImages(imageList);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "ブログの読み込みに失敗しました"))
      .finally(() => setLoading(false));
  }, [blogId]);

  async function handleDelete() {
    if (!window.confirm("このブログを削除しますか？")) return;
    try {
      await adminApi.deleteBlog(blogId);
      router.push(`/admin/teachers/${teacherId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ブログの削除に失敗しました");
    }
  }

  if (loading) return <div className="page spinner-page">読み込み中...</div>;
  if (!blog) {
    return (
      <div className="page">
        <div className="alert alert-error">{error || "ブログが見つかりません"}</div>
        <Link href={`/admin/teachers/${teacherId}`} className="btn btn-ghost">戻る</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{blog.title}</h1>
        <div className="row">
          <button className="btn btn-danger btn-sm" onClick={() => void handleDelete()}>削除</button>
          <Link href={`/admin/teachers/${teacherId}`} className="btn btn-ghost btn-sm">講師詳細へ戻る</Link>
        </div>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="card">
        <div className="muted" style={{ fontSize: "0.85rem", marginBottom: 10 }}>
          {blog.teacherName} / {new Date(blog.createdAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
        </div>
        <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{blog.content}</div>
      </div>
      {images.length > 0 && (
        <div className="card">
          <div className="section-title">画像</div>
          <div className="image-grid">
            {images.map((image) => (
              <div key={image.id} className="image-tile">
                <img src={resolveFileUrl(image.imageUrl)} alt="" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
