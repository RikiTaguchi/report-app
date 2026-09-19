"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, ApiError } from "@/lib/api";
import type { BlogResponse } from "@/lib/types";

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<BlogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadBlogs();
  }, []);

  async function loadBlogs() {
    try {
      const data = await adminApi.listAllBlogs();
      setBlogs(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteBlog(blogId: string) {
    if (!window.confirm("このブログを削除してもよろしいですか?")) return;
    setError(null);
    try {
      await adminApi.deleteBlog(blogId);
      setBlogs(blogs.filter((b) => b.id !== blogId));
      setSuccessMsg("ブログを削除しました");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    }
  }

  if (loading) {
    return <div className="page spinner-page">読み込み中...</div>;
  }

  const sortedBlogs = [...blogs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="page">
      <div className="page-header">
        <h1>ブログ</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      {sortedBlogs.length > 0 ? (
        <div className="stack">
          {sortedBlogs.map((blog) => (
            <div key={blog.id} className="card">
              <div className="row-between">
                <div style={{ flex: 1 }}>
                  <Link
                    href={`/admin/blogs/${blog.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: "var(--foreground)",
                        marginBottom: "4px",
                      }}
                    >
                      {blog.title}
                    </div>
                  </Link>
                  <div className="muted" style={{ fontSize: "0.85rem" }}>
                    {blog.teacherName || "講師"}
                  </div>
                  <div
                    className="muted"
                    style={{ fontSize: "0.8rem", marginTop: "4px" }}
                  >
                    作成: {new Date(blog.createdAt).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                    {blog.publishedAt && (
                      <>
                        {" "}
                        / 公開: {new Date(blog.publishedAt).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                      </>
                    )}
                  </div>
                </div>
                <div className="row">
                  {blog.publishedAt ? (
                    <span className="badge badge-success">公開中</span>
                  ) : (
                    <span className="badge badge-muted">下書き</span>
                  )}
                </div>
              </div>
              <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                <div className="row">
                  <Link href={`/admin/blogs/${blog.id}`} className="btn btn-sm btn-ghost">
                    詳細
                  </Link>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDeleteBlog(blog.id)}
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">ブログがありません</div>
      )}
    </div>
  );
}
