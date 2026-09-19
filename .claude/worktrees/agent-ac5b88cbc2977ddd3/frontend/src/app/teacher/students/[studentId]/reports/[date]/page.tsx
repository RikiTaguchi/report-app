"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { teacherApi, ApiError, resolveFileUrl } from "@/lib/api";
import { subscribeTopic, reportCommentsTopic } from "@/lib/ws";
import type { DailyReportDetailResponse, ReportCommentResponse, ReportImageResponse, ReportLikeStatusResponse, CommentEvent } from "@/lib/types";

interface Params {
  studentId: string;
  date: string;
}

export default function ReportDetailPage({ params }: { params: Promise<Params> }) {
  const { studentId, date } = use(params);
  const [report, setReport] = useState<DailyReportDetailResponse | null>(null);
  const [comments, setComments] = useState<ReportCommentResponse[]>([]);
  const [images, setImages] = useState<ReportImageResponse[]>([]);
  const [likeStatus, setLikeStatus] = useState<ReportLikeStatusResponse>({ liked: false, count: 0 });
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [reportData, commentsData, imagesData, likeData] = await Promise.all([
          teacherApi.getReport(studentId, date),
          teacherApi.listComments(studentId, date),
          teacherApi.listImages(studentId, date),
          teacherApi.getLikeStatus(studentId, date),
        ]);
        setReport(reportData);
        setComments(commentsData);
        setImages(imagesData);
        setLikeStatus(likeData);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("日報の読み込みに失敗しました");
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [studentId, date]);

  useEffect(() => {
    return subscribeTopic<CommentEvent<ReportCommentResponse>>(
      reportCommentsTopic(studentId, date),
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
  }, [studentId, date]);

  async function handleAddComment() {
    if (!newComment.trim()) return;
    try {
      setSubmitting(true);
      const comment = await teacherApi.createComment(studentId, date, { content: newComment });
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
      const updated = await teacherApi.updateComment(studentId, date, commentId, {
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
    if (!confirm("コメントを削除しますか？")) return;
    try {
      setSubmitting(true);
      await teacherApi.deleteComment(studentId, date, commentId);
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
        await teacherApi.unlike(studentId, date);
        setLikeStatus({ liked: false, count: likeStatus.count - 1 });
      } else {
        await teacherApi.like(studentId, date);
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

  if (!report) {
    return (
      <div className="page">
        <div className="empty-state">日報が見つかりません</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="breadcrumb">
        <Link href="/teacher">生徒一覧</Link>
        <span>/</span>
        <Link href={`/teacher/students/${studentId}/reports`}>日報一覧</Link>
        <span>/</span>
        <span>{new Date(date).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}</span>
      </div>

      <div className="page-header">
        <h1>{new Date(date).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stack">
        {/* Report content */}
        <div className="card">
          <div className="stack-sm">
            {report.items.length > 0 && (
              <div>
                <div className="label">項目</div>
                <div className="stack-sm">
                  {report.items.map((item) => (
                    <div key={item.reportItemDefinitionId} className="checkbox-row">
                      <input
                        type="checkbox"
                        disabled
                        checked={item.checked ?? false}
                        readOnly
                      />
                      <label>
                        {item.label}
                        {item.itemType === "TEXT" && item.textValue && (
                          <> — {item.textValue}</>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.studyTimes.length > 0 && (
              <div>
                <div className="label">学習時間</div>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>教科</th>
                        <th>時間（分）</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.studyTimes.map((st) => (
                        <tr key={st.subjectId}>
                          <td>{st.subjectName}</td>
                          <td>{st.minutes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Images */}
        {images.length > 0 && (
          <div className="card">
            <div className="label">画像</div>
            <div className="image-grid">
              {images.map((img) => (
                <div key={img.id} className="image-tile">
                  <img src={resolveFileUrl(img.imageUrl)} alt="Report image" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Like */}
        <div className="card">
          <button
            className={`btn ${likeStatus.liked ? "btn-primary" : "btn-ghost"}`}
            onClick={handleToggleLike}
            disabled={submitting}
          >
            {likeStatus.liked ? "♥" : "♡"} {likeStatus.count}件のいいね
          </button>
        </div>

        {/* Comments */}
        <div className="card">
          <div className="label">コメント</div>
          <div className="stack">
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
                    <span>{comment.authorName || comment.authorId}</span>
                    <span>{new Date(comment.createdAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</span>
                  </div>
                  <div>{comment.content}</div>
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
        </div>
      </div>
    </div>
  );
}
