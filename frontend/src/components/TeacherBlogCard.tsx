"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { Avatar } from "@/components/Avatar";
import { CommentActionsMenu } from "@/components/CommentActionsMenu";
import { ImageCarousel } from "@/components/ImageCarousel";
import { ChatIcon, HeartIcon } from "@/components/icons";
import { teacherApi, ApiError } from "@/lib/api";
import { blogCommentsTopic, subscribeTopic } from "@/lib/ws";
import type {
  BlogCommentResponse,
  BlogImageResponse,
  BlogResponse,
  CommentEvent,
  ReportLikeStatusResponse,
} from "@/lib/types";

export interface TeacherBlogFeedItem {
  blog: BlogResponse;
  images: BlogImageResponse[];
  comments: BlogCommentResponse[];
  likeStatus: ReportLikeStatusResponse;
  authorProfileImageUrl: string | null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  });
}

function formatDateTime(dateTimeStr: string): string {
  return new Date(dateTimeStr).toLocaleString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
}

export function TeacherBlogCard({
  item,
  onDeleted,
}: {
  item: TeacherBlogFeedItem;
  onDeleted?: (blogId: string) => void;
}) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const { blog, images } = item;
  const authorName = blog.teacherName || blog.teacherId;
  const isOwnAuthor = Boolean(user && blog.teacherId === user.id);
  const profileHref = isOwnAuthor ? "/teacher/settings" : `/teacher/teachers/${blog.teacherId}`;
  const [expanded, setExpanded] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState(item.comments);
  const [likeStatus, setLikeStatus] = useState(item.likeStatus);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [liking, setLiking] = useState(false);
  const summary = [blog.title, blog.content].filter(Boolean).join("　");
  const hasBodyContent = Boolean(blog.title || blog.content);

  useEffect(() => {
    return subscribeTopic<CommentEvent<BlogCommentResponse>>(blogCommentsTopic(blog.id), (event) => {
      setComments((prev) => {
        if (event.eventType === "DELETED") return prev.filter((comment) => comment.id !== event.commentId);
        if (!event.comment) return prev;
        return prev.some((comment) => comment.id === event.comment!.id)
          ? prev.map((comment) => (comment.id === event.comment!.id ? event.comment! : comment))
          : [...prev, event.comment!];
      });
    });
  }, [blog.id]);

  async function handleToggleLike() {
    if (liking) return;
    setLiking(true);
    try {
      if (likeStatus.liked) {
        await teacherApi.unlikeBlog(blog.id);
        setLikeStatus((prev) => ({ liked: false, count: Math.max(0, prev.count - 1) }));
      } else {
        await teacherApi.likeBlog(blog.id);
        setLikeStatus((prev) => ({ liked: true, count: prev.count + 1 }));
      }
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "いいね操作に失敗しました", "error");
    } finally {
      setLiking(false);
    }
  }

  async function handleAddComment() {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const comment = await teacherApi.createBlogComment(blog.id, { content: newComment.trim() });
      setComments((prev) => (prev.some((item) => item.id === comment.id) ? prev : [...prev, comment]));
      setNewComment("");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "コメントの投稿に失敗しました", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditComment(commentId: string) {
    if (!editingCommentContent.trim() || submitting) return;
    setSubmitting(true);
    try {
      const updated = await teacherApi.updateBlogComment(blog.id, commentId, {
        content: editingCommentContent.trim(),
      });
      setComments((prev) => prev.map((comment) => (comment.id === commentId ? updated : comment)));
      setEditingCommentId(null);
      setEditingCommentContent("");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "コメントの更新に失敗しました", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!window.confirm("コメントを削除しますか？") || submitting) return;
    setSubmitting(true);
    try {
      await teacherApi.deleteBlogComment(blog.id, commentId);
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "コメントの削除に失敗しました", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteBlog() {
    if (!window.confirm("このブログを削除してよろしいですか？") || submitting) return;
    setSubmitting(true);
    try {
      await teacherApi.deleteBlog(blog.id);
      onDeleted?.(blog.id);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "削除に失敗しました", "error");
      setSubmitting(false);
    }
  }

  return (
    <article className="ig-card">
      <div className="ig-card-header ig-report-card-header">
        <Link href={profileHref} className="ig-avatar" aria-label={`${authorName}のプロフィール`}>
          <Avatar
            src={item.authorProfileImageUrl}
            name={authorName}
            photoClassName="ig-avatar-photo"
          />
        </Link>
        <div className="ig-card-header-main">
          <div className="ig-card-header-title">
            <Link href={profileHref} style={{ color: "inherit", textDecoration: "none" }}>
              {authorName}
            </Link>
          </div>
          <div className="ig-card-header-sub">
            {blog.createdAt && <div>{formatDate(blog.createdAt)}</div>}
            {blog.updatedAt && <div>※最終更新：{formatDateTime(blog.updatedAt)}</div>}
          </div>
        </div>
        {isOwnAuthor && (
          <div className="ig-card-header-actions">
            <CommentActionsMenu
              onEdit={() => router.push(`/teacher/blogs/${blog.id}/edit`)}
              onDelete={() => void handleDeleteBlog()}
            />
          </div>
        )}
      </div>

      <ImageCarousel images={images} altText="ブログ画像" fallbackSeed={`blog-${blog.id}`} />

      <div className="ig-card-body" style={{ paddingTop: 12 }}>
        <div className="ig-action-bar">
          <button
            type="button"
            className={`ig-icon-btn ${likeStatus.liked ? "liked" : ""}`}
            onClick={handleToggleLike}
            disabled={liking}
            aria-label={likeStatus.liked ? "いいねを取り消す" : "いいねする"}
          >
            <HeartIcon filled={likeStatus.liked} />
            {likeStatus.count > 0 && <span>{likeStatus.count}</span>}
          </button>
          <button
            type="button"
            className="ig-icon-btn"
            onClick={() => setCommentsOpen((value) => !value)}
            aria-label="コメントを表示・非表示"
          >
            <ChatIcon />
            {comments.length > 0 && <span>{comments.length}</span>}
          </button>
        </div>

        {hasBodyContent && !expanded && (
          <div className="ig-body-line-row">
            <div className="ig-body-oneline">{summary}</div>
            <button type="button" className="ig-expand-toggle" onClick={() => setExpanded(true)}>
              全体を表示
            </button>
          </div>
        )}

        {expanded && hasBodyContent && (
          <div className="ig-card-body-full">
            {blog.title && <div className="ig-section-label">{blog.title}</div>}
            {blog.content && (
              <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{blog.content}</div>
            )}
            <button type="button" className="ig-expand-toggle" onClick={() => setExpanded(false)}>
              一部を表示
            </button>
          </div>
        )}

        {commentsOpen && (
          <div className="stack-sm" style={{ marginTop: 14 }}>
            {comments.length === 0 ? (
              <div className="empty-state">コメントがまだありません</div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="ig-comment-row-with-avatar">
                  <div className="ig-avatar-sm">
                    <Avatar name={comment.authorName} photoClassName="ig-avatar-sm-photo" />
                  </div>
                  {editingCommentId === comment.id ? (
                    <div className="ig-comment-row-main">
                      <textarea
                        className="textarea"
                        value={editingCommentContent}
                        onChange={(event) => setEditingCommentContent(event.target.value)}
                        disabled={submitting}
                      />
                      <div className="row" style={{ marginTop: 6, gap: 6 }}>
                        <button className="btn btn-sm btn-primary" onClick={() => handleEditComment(comment.id)} disabled={submitting}>保存</button>
                        <button className="btn btn-sm btn-ghost" onClick={() => { setEditingCommentId(null); setEditingCommentContent(""); }} disabled={submitting}>キャンセル</button>
                      </div>
                    </div>
                  ) : (
                    <div className="ig-comment-row-main">
                      <div className="ig-comment-text-line">
                        <span className="ig-comment-author">{comment.authorName || comment.authorId}</span>{comment.content}
                      </div>
                      <div className="ig-comment-meta">{formatDateTime(comment.createdAt)}</div>
                    </div>
                  )}
                  {editingCommentId !== comment.id && comment.authorType === "TEACHER" && comment.authorId === user?.id && (
                    <CommentActionsMenu
                      onEdit={() => { setEditingCommentId(comment.id); setEditingCommentContent(comment.content); }}
                      onDelete={() => handleDeleteComment(comment.id)}
                    />
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
              <button type="button" className="ig-comment-form-submit" onClick={handleAddComment} disabled={submitting || !newComment.trim()}>
                送信
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
