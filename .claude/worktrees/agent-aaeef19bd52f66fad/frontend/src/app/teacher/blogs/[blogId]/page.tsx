"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { teacherApi, ApiError } from "@/lib/api";
import { subscribeTopic, blogCommentsTopic } from "@/lib/ws";
import { Avatar } from "@/components/Avatar";
import { ImageCarousel } from "@/components/ImageCarousel";
import { CommentActionsMenu } from "@/components/CommentActionsMenu";
import { ChatIcon, HeartIcon } from "@/components/icons";
import type {
  BlogResponse,
  BlogCommentResponse,
  BlogImageResponse,
  ReportLikeStatusResponse,
  CommentEvent,
} from "@/lib/types";

interface Params {
  blogId: string;
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
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

  const isOwner = Boolean(blog && user && blog.teacherId === user.id);

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
        setError(err instanceof ApiError ? err.message : "ブログの読み込みに失敗しました");
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
            return prev.filter((comment) => comment.id !== event.commentId);
          }
          if (!event.comment) return prev;
          const exists = prev.some((comment) => comment.id === event.comment!.id);
          return exists
            ? prev.map((comment) => (comment.id === event.comment!.id ? event.comment! : comment))
            : [...prev, event.comment!];
        });
      }
    );
  }, [blogId]);

  async function handlePublish() {
    if (!blog || !confirm("公開しますか？")) return;
    try {
      setSubmitting(true);
      setBlog(await teacherApi.publishBlog(blogId));
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
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
      if (err instanceof ApiError) setError(err.message);
      setSubmitting(false);
    }
  }

  async function handleAddComment() {
    if (!newComment.trim()) return;
    try {
      setSubmitting(true);
      const comment = await teacherApi.createBlogComment(blogId, { content: newComment });
      setComments((prev) => (prev.some((item) => item.id === comment.id) ? prev : [...prev, comment]));
      setNewComment("");
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
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
      setComments((prev) => prev.map((comment) => (comment.id === commentId ? updated : comment)));
      setEditingCommentId(null);
      setEditingCommentContent("");
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("削除しますか？")) return;
    try {
      setSubmitting(true);
      await teacherApi.deleteBlogComment(blogId, commentId);
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleLike() {
    try {
      if (likeStatus.liked) {
        await teacherApi.unlikeBlog(blogId);
        setLikeStatus((prev) => ({ liked: false, count: Math.max(0, prev.count - 1) }));
      } else {
        await teacherApi.likeBlog(blogId);
        setLikeStatus((prev) => ({ liked: true, count: prev.count + 1 }));
      }
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    }
  }

  if (loading) return <div className="spinner-page">読み込み中...</div>;

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

      {error && <div className="alert alert-error">{error}</div>}

      <div className="ig-card">
        <div className="ig-card-header">
          <div className="ig-avatar">
            <Avatar
              src={isOwner ? user?.profileImageUrl : undefined}
              name={blog.teacherName || user?.name || blog.teacherId}
              photoClassName="ig-avatar-photo"
            />
          </div>
          <div className="ig-card-header-main">
            <div className="ig-card-header-title">{blog.title}</div>
            <div className="ig-card-header-sub">
              {blog.publishedAt ? `公開 ${formatDateTime(blog.publishedAt)}` : "下書き"}
            </div>
          </div>
          {isOwner && (
            <div className="ig-card-header-actions">
              {!blog.publishedAt && (
                <button className="btn btn-primary btn-sm" onClick={handlePublish} disabled={submitting}>
                  公開
                </button>
              )}
              <Link href={`/teacher/blogs/${blogId}/edit`} className="btn btn-ghost btn-sm">
                編集
              </Link>
              <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={submitting}>
                削除
              </button>
            </div>
          )}
        </div>

        <ImageCarousel images={images} altText="ブログ画像" fallbackSeed={`blog-${blog.id}`} />

        <div className="ig-card-body" style={{ paddingTop: "12px" }}>
          <div className="ig-action-bar">
            <button
              className={`ig-icon-btn ${likeStatus.liked ? "liked" : ""}`}
              onClick={handleToggleLike}
              disabled={submitting}
              type="button"
              aria-label={likeStatus.liked ? "いいねを取り消す" : "いいねする"}
            >
              <HeartIcon filled={likeStatus.liked} />
              {likeStatus.count > 0 && <span>{likeStatus.count}</span>}
            </button>
            <button
              className="ig-icon-btn"
              type="button"
              onClick={() => setCommentsOpen((open) => !open)}
              aria-expanded={commentsOpen}
            >
              <ChatIcon />
              {comments.length > 0 && <span>{comments.length}</span>}
            </button>
          </div>

          <div className="ig-card-body-full">
            <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.6", wordBreak: "break-word" }}>
              {blog.content}
            </div>
          </div>

          {!commentsOpen && comments.length > 0 && (
            <button type="button" className="ig-view-comments-link" onClick={() => setCommentsOpen(true)}>
              コメントをすべて見る（{comments.length}件）
            </button>
          )}

          {commentsOpen && (
            <div className="stack-sm">
              <button type="button" className="ig-view-comments-link" onClick={() => setCommentsOpen(false)}>
                コメントを非表示にする
              </button>
              {comments.length === 0 ? (
                <div className="empty-state">コメントがまだありません</div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="ig-comment-row-with-avatar">
                    <div className="ig-avatar-sm">
                      <Avatar name={comment.authorName || comment.authorId} photoClassName="ig-avatar-sm-photo" />
                    </div>
                    {editingCommentId === comment.id ? (
                      <div className="ig-comment-row-main">
                        <textarea
                          className="textarea"
                          value={editingCommentContent}
                          onChange={(event) => setEditingCommentContent(event.target.value)}
                          disabled={submitting}
                        />
                        <div className="row" style={{ marginTop: "6px", gap: "6px" }}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleEditComment(comment.id)} disabled={submitting}>
                            保存
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
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
                      <div className="ig-comment-row-main">
                        <div className="ig-comment-text-line">
                          <span className="ig-comment-author">{comment.authorName || comment.authorId}</span>{" "}
                          {comment.content}
                        </div>
                        <div className="ig-comment-meta">
                          {formatDateTime(comment.createdAt)}
                          {comment.authorType === "TEACHER" && comment.authorId === user?.id && (
                            <CommentActionsMenu
                              onEdit={() => {
                                setEditingCommentId(comment.id);
                                setEditingCommentContent(comment.content);
                              }}
                              onDelete={() => handleDeleteComment(comment.id)}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}

              <div className="ig-comment-form">
                <div className="ig-avatar-sm">
                  <Avatar src={user?.profileImageUrl} name={user?.name} photoClassName="ig-avatar-sm-photo" />
                </div>
                <textarea
                  className="textarea"
                  placeholder="コメントを入力"
                  value={newComment}
                  onChange={(event) => setNewComment(event.target.value)}
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="ig-comment-form-submit"
                  onClick={handleAddComment}
                  disabled={submitting || !newComment.trim()}
                >
                  送信
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
