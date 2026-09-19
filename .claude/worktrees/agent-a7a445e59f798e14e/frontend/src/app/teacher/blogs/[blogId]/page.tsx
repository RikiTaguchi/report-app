"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { teacherApi, ApiError, resolveFileUrl } from "@/lib/api";
import { subscribeTopic, blogCommentsTopic } from "@/lib/ws";
import type { BlogResponse, BlogCommentResponse, BlogImageResponse, ReportLikeStatusResponse, CommentEvent } from "@/lib/types";

interface Params {
  blogId: string;
}

export default function BlogDetailPage({ params }: { params: Promise<Params> }) {
  const { blogId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [blog, setBlog] = useState<BlogResponse | null>(null);
  const [comments, setComments] = useState<BlogCommentResponse[]>([]);
  const [images, setImages] = useState<BlogImageResponse[]>([]);
  const [likeStatus, setLikeStatus] = useState<ReportLikeStatusResponse>({ liked: false, count: 0 });
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isOwner = blog && user && blog.teacherId === user.id;

  useEffect(() => {
    async function load() {
      try {
        const [blogData, commentsData, imagesData, likeData] = await Promise.all([
          teacherApi.getBlog(blogId),
          teacherApi.listBlogComments(blogId),
          teacherApi.listBlogImages(blogId),
          teacherApi.getBlogLikeStatus(blogId),
        ]);
        setBlog(blogData);
        setComments(commentsData);
        setImages(imagesData);
        setLikeStatus(likeData);
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

  useEffect(() => {
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

  async function handlePublish() {
    if (!blog || !confirm("公開しますか？")) return;

    try {
      setSubmitting(true);
      const updated = await teacherApi.publishBlog(blogId);
      setBlog(updated);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!blog || !confirm("削除しますか？")) return;

    try {
      setSubmitting(true);
      await teacherApi.deleteBlog(blogId);
      router.push("/teacher/blogs");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
      setSubmitting(false);
    }
  }

  async function handleAddComment() {
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const comment = await teacherApi.createBlogComment(blogId, { content: newComment });
      setComments([...comments, comment]);
      setNewComment("");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditComment(commentId: string) {
    if (!editingCommentContent.trim()) return;

    try {
      setSubmitting(true);
      const updated = await teacherApi.updateBlogComment(blogId, commentId, {
        content: editingCommentContent,
      });
      setComments(comments.map((c) => (c.id === commentId ? updated : c)));
      setEditingCommentId(null);
      setEditingCommentContent("");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("削除しますか？")) return;

    try {
      setSubmitting(true);
      await teacherApi.deleteBlogComment(blogId, commentId);
      setComments(comments.filter((c) => c.id !== commentId));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleLike() {
    try {
      if (likeStatus.liked) {
        await teacherApi.unlikeBlog(blogId);
        setLikeStatus({ liked: false, count: likeStatus.count - 1 });
      } else {
        await teacherApi.likeBlog(blogId);
        setLikeStatus({ liked: true, count: likeStatus.count + 1 });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    }
  }

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

  return (
    <div className="page">
      <div className="breadcrumb">
        <Link href="/teacher/blogs">ブログ</Link>
        <span>/</span>
        <span>{blog.title}</span>
      </div>

      <div className="page-header">
        <div>
          <h1>{blog.title}</h1>
          <div className="muted" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
            {blog.publishedAt
              ? `公開: ${new Date(blog.publishedAt).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}`
              : "下書き"}
          </div>
        </div>
        {isOwner && (
          <div className="row">
            {!blog.publishedAt && (
              <button
                className="btn btn-primary btn-sm"
                onClick={handlePublish}
                disabled={submitting}
              >
                公開
              </button>
            )}
            <Link href={`/teacher/blogs/${blogId}/edit`} className="btn btn-ghost btn-sm">
              編集
            </Link>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleDelete}
              disabled={submitting}
            >
              削除
            </button>
          </div>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stack">
        {images.length > 0 && (
          <div className="card">
            <div className="image-grid">
              {images.map((img) => (
                <div key={img.id} className="image-tile">
                  <img src={resolveFileUrl(img.imageUrl)} alt="Blog image" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <div className="row-between">
            <button
              className={`btn btn-sm ${likeStatus.liked ? "btn-primary" : "btn-ghost"}`}
              onClick={handleToggleLike}
              disabled={submitting}
            >
              {likeStatus.liked ? "♥" : "♡"} {likeStatus.count}件のいいね
            </button>
            <span className="muted" style={{ fontSize: "0.85rem" }}>
              💬 {comments.length}件のコメント
            </span>
          </div>
        </div>

        <div className="card">
          <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {blog.content}
          </div>
        </div>

        <div className="card">
          {!commentsOpen ? (
            <button className="comment-toggle" onClick={() => setCommentsOpen(true)}>
              コメントを表示（{comments.length}件）
            </button>
          ) : (
            <div className="stack">
              <div className="row-between">
                <div className="label">コメント</div>
                <button className="comment-toggle" onClick={() => setCommentsOpen(false)}>
                  閉じる
                </button>
              </div>
              {comments.map((comment) =>
                editingCommentId === comment.id ? (
                  <div key={comment.id} className="comment">
                    <textarea
                      className="textarea"
                      value={editingCommentContent}
                      onChange={(e) => setEditingCommentContent(e.target.value)}
                      disabled={submitting}
                    />
                    <div className="row" style={{ marginTop: "8px", gap: "6px" }}>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleEditComment(comment.id)}
                        disabled={submitting}
                      >
                        保存
                      </button>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditingCommentContent("");
                        }}
                        disabled={submitting}
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={comment.id} className="comment">
                    <div className="comment-meta">
                      <span>
                        {comment.authorType === "TEACHER" ? `${comment.authorName || comment.authorId} (講師)` : `${comment.authorName || comment.authorId} (生徒)`}
                      </span>
                      <span>{new Date(comment.createdAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</span>
                    </div>
                    <div>{comment.content}</div>
                    {comment.authorType === "TEACHER" && comment.authorId === user?.id && (
                      <div className="row" style={{ marginTop: "6px", gap: "6px" }}>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditingCommentContent(comment.content);
                          }}
                          disabled={submitting}
                        >
                          編集
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={submitting}
                        >
                          削除
                        </button>
                      </div>
                    )}
                  </div>
                )
              )}

              <div>
                <textarea
                  className="textarea"
                  placeholder="コメントを入力"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={submitting}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleAddComment}
                  disabled={submitting || !newComment.trim()}
                  style={{ marginTop: "8px" }}
                >
                  コメント送信
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
