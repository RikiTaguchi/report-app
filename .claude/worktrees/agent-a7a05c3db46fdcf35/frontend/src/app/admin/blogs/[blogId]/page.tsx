"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, ApiError, resolveFileUrl } from "@/lib/api";
import { subscribeTopic, blogCommentsTopic } from "@/lib/ws";
import type { BlogResponse, BlogCommentResponse, BlogImageResponse, CommentEvent } from "@/lib/types";

export default function BlogDetailPage({
  params,
}: {
  params: Promise<{ blogId: string }>;
}) {
  const [blogId, setBlogId] = useState<string>("");
  const [blog, setBlog] = useState<BlogResponse | null>(null);
  const [comments, setComments] = useState<BlogCommentResponse[]>([]);
  const [images, setImages] = useState<BlogImageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const resolvedParams = await params;
      setBlogId(resolvedParams.blogId);
    })();
  }, [params]);

  useEffect(() => {
    if (!blogId) return;
    loadBlogData();
  }, [blogId]);

  useEffect(() => {
    if (!blogId) return;
    return subscribeTopic<CommentEvent<BlogCommentResponse>>(
      blogCommentsTopic(blogId),
      (event) => {
        setComments((prev) => {
          if (event.eventType === "DELETED") {
            return prev.filter((c) => c.id !== event.commentId);
          }
          if (!event.comment) return prev;
          const exists = prev.some((c) => c.id === event.comment!.id);
          return exists
            ? prev.map((c) => (c.id === event.comment!.id ? event.comment! : c))
            : [...prev, event.comment!];
        });
      }
    );
  }, [blogId]);

  async function loadBlogData() {
    setLoading(true);
    setError(null);
    try {
      const [b, c, i] = await Promise.all([
        adminApi.getBlog(blogId),
        adminApi.listBlogComments(blogId),
        adminApi.listBlogImages(blogId),
      ]);
      setBlog(b);
      setComments(c);
      setImages(i);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!window.confirm("このコメントを削除してもよろしいですか?")) return;
    setError(null);
    try {
      await adminApi.deleteBlogComment(blogId, commentId);
      setComments(comments.filter((c) => c.id !== commentId));
      setSuccessMsg("コメントを削除しました");
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

  if (!blog) {
    return (
      <div className="page">
        <div className="alert alert-error">{error || "ブログが見つかりません"}</div>
        <Link href="/admin/blogs" className="btn btn-ghost">
          戻る
        </Link>
      </div>
    );
  }

  const rootComments = comments.filter((c) => !c.parentCommentId);
  const getReplyComments = (parentId: string) =>
    comments.filter((c) => c.parentCommentId === parentId);

  return (
    <div className="page">
      <div className="page-header">
        <h1>ブログ詳細</h1>
        <Link href="/admin/blogs" className="btn btn-ghost btn-sm">
          戻る
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="card">
        <div className="row-between">
          <div>
            <div className="section-title">{blog.title}</div>
            <div className="muted" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
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
          <div>
            {blog.publishedAt ? (
              <span className="badge badge-success">公開中</span>
            ) : (
              <span className="badge badge-muted">下書き</span>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: "0.95rem", whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
          {blog.content}
        </div>
      </div>

      {images.length > 0 && (
        <div className="card">
          <div className="section-title">画像</div>
          <div className="image-grid">
            {images.map((img) => (
              <div key={img.id} className="image-tile">
                <img
                  src={resolveFileUrl(img.imageUrl)}
                  alt="ブログ画像"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {comments.length > 0 && (
        <div className="card">
          <div className="section-title">コメント</div>
          <div className="stack">
            {rootComments.map((comment) => (
              <div key={comment.id}>
                <div className="comment">
                  <div className="comment-meta">
                    <span>
                      {comment.authorType === "TEACHER" ? "講師: " : "生徒: "}
                      {comment.authorName || "ユーザー"}
                    </span>
                    <span>{new Date(comment.createdAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</span>
                  </div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      whiteSpace: "pre-wrap",
                      wordWrap: "break-word",
                    }}
                  >
                    {comment.content}
                  </div>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDeleteComment(comment.id)}
                    style={{ marginTop: "8px" }}
                  >
                    削除
                  </button>
                </div>

                {getReplyComments(comment.id).length > 0 && (
                  <div className="comment-thread">
                    {getReplyComments(comment.id).map((reply) => (
                      <div key={reply.id} className="comment">
                        <div className="comment-meta">
                          <span>
                            {reply.authorType === "TEACHER" ? "講師: " : "生徒: "}
                            {reply.authorName || "ユーザー"}
                          </span>
                          <span>{new Date(reply.createdAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</span>
                        </div>
                        <div
                          style={{
                            fontSize: "0.9rem",
                            whiteSpace: "pre-wrap",
                            wordWrap: "break-word",
                          }}
                        >
                          {reply.content}
                        </div>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteComment(reply.id)}
                          style={{ marginTop: "8px" }}
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: "20px" }}>
        <Link href="/admin/blogs" className="btn btn-ghost">
          戻る
        </Link>
      </div>
    </div>
  );
}
