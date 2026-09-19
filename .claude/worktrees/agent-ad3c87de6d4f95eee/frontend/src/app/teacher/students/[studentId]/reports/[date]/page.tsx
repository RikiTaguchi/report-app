"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { teacherApi, ApiError } from "@/lib/api";
import { subscribeTopic, reportCommentsTopic } from "@/lib/ws";
import { Avatar } from "@/components/Avatar";
import { ImageCarousel } from "@/components/ImageCarousel";
import { CommentActionsMenu } from "@/components/CommentActionsMenu";
import { ChatIcon, HeartIcon, DocumentIcon, ClockIcon } from "@/components/icons";
import type {
  DailyReportDetailResponse,
  ReportCommentResponse,
  ReportImageResponse,
  ReportLikeStatusResponse,
  CommentEvent,
} from "@/lib/types";

interface Params {
  studentId: string;
  date: string;
}

function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("ja-JP", {
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

function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}時間${minutes}分` : `${minutes}分`;
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
  const [expanded, setExpanded] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(true);
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
        setError(err instanceof ApiError ? err.message : "日報の読み込みに失敗しました");
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
          if (event.eventType === "DELETED") return prev.filter((c) => c.id !== event.commentId);
          if (!event.comment) return prev;
          return prev.some((c) => c.id === event.comment!.id)
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
      setComments((prev) => [...prev, comment]);
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
      const updated = await teacherApi.updateComment(studentId, date, commentId, { content: editingCommentContent });
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
      setEditingCommentId(null);
      setEditingCommentContent("");
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("コメントを削除しますか？")) return;
    try {
      setSubmitting(true);
      await teacherApi.deleteComment(studentId, date, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleLike() {
    try {
      if (likeStatus.liked) {
        await teacherApi.unlike(studentId, date);
        setLikeStatus({ liked: false, count: Math.max(0, likeStatus.count - 1) });
      } else {
        await teacherApi.like(studentId, date);
        setLikeStatus({ liked: true, count: likeStatus.count + 1 });
      }
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    }
  }

  if (loading) return <div className="spinner-page">読み込み中...</div>;
  if (!report) {
    return <div className="page"><div className="empty-state">日報が見つかりません</div></div>;
  }

  const checkedCount = report.items.filter((item) => item.checked).length;
  const totalStudyMinutes = report.studyTimes.reduce((sum, item) => sum + item.minutes, 0);
  const hasBodyContent = Boolean(report.freeText) || report.items.length > 0 || report.studyTimes.length > 0;
  const summary = [
    report.freeText,
    report.items.length > 0 ? `${checkedCount}/${report.items.length}項目を達成` : null,
    report.studyTimes.length > 0 ? `学習${formatMinutes(totalStudyMinutes)}` : null,
  ].filter(Boolean).join("　");

  return (
    <div className="page">
      <div className="breadcrumb">
        <Link href={`/teacher/students/${studentId}`}>生徒プロフィール</Link>
        <span>/</span>
        <Link href={`/teacher/students/${studentId}/reports`}>日報一覧</Link>
        <span>/</span>
        <span>{formatDate(date)}</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="ig-card" style={{ marginTop: 14 }}>
        <div className="ig-card-header">
          <div className="ig-avatar">
            <Avatar name="生徒" photoClassName="ig-avatar-photo" />
          </div>
          <div className="ig-card-header-main">
            <div className="ig-card-header-title">{formatDate(date)}</div>
            <div className="ig-card-header-sub">
              {report.submittedAt ? `提出: ${formatDateTime(report.submittedAt)}` : `更新: ${formatDateTime(report.updatedAt)}`}
            </div>
          </div>
          <span className="badge badge-success">提出</span>
        </div>

        {images.length > 0 && (
          <ImageCarousel images={images} altText="日報画像" fallbackSeed={`teacher-report-${date}`} />
        )}

        <div className="ig-card-body">
          <div className="ig-action-bar">
            <button type="button" className={`ig-icon-btn ${likeStatus.liked ? "liked" : ""}`} onClick={handleToggleLike} disabled={submitting}>
              <HeartIcon filled={likeStatus.liked} />
              {likeStatus.count > 0 && <span>{likeStatus.count}</span>}
            </button>
            <button type="button" className="ig-icon-btn" onClick={() => setCommentsOpen((value) => !value)}>
              <ChatIcon />
              {comments.length > 0 && <span>{comments.length}</span>}
            </button>
          </div>

          {hasBodyContent && !expanded && (
            <div className="ig-body-line-row">
              <div className="ig-body-oneline">{summary}</div>
              <button type="button" className="ig-expand-toggle" onClick={() => setExpanded(true)}>全体を表示</button>
            </div>
          )}

          {expanded && hasBodyContent && (
            <div className="ig-card-body-full">
              {report.freeText && <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{report.freeText}</div>}
              {report.items.length > 0 && (
                <div>
                  <div className="ig-section-label"><DocumentIcon /> 項目</div>
                  <div className="stack-sm" style={{ paddingLeft: 14 }}>
                    {report.items.map((item) => (
                      <div className="checkbox-row" key={item.reportItemDefinitionId}>
                        <input type="checkbox" className="ig-checkbox" checked={item.checked ?? false} disabled readOnly />
                        <span style={{ fontSize: "0.8rem" }}>{item.label}{item.itemType === "TEXT" && item.textValue ? `: ${item.textValue}` : ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {report.studyTimes.length > 0 && (
                <div>
                  <div className="ig-section-label"><ClockIcon /> 学習時間</div>
                  <div className="stack-sm" style={{ paddingLeft: 14 }}>
                    <strong>{formatMinutes(totalStudyMinutes)}</strong>
                    {report.studyTimes.map((item) => <div key={item.subjectId} style={{ fontSize: "0.8rem" }}>{item.subjectName}: {formatMinutes(item.minutes)}</div>)}
                  </div>
                </div>
              )}
              <button type="button" className="ig-expand-toggle" onClick={() => setExpanded(false)}>一部を表示</button>
            </div>
          )}

          {commentsOpen && (
            <div className="stack-sm">
              {comments.length === 0 ? <div className="empty-state">コメントがまだありません</div> : comments.map((comment) => (
                editingCommentId === comment.id ? (
                  <div key={comment.id} className="ig-comment-row-with-avatar">
                    <div className="ig-avatar-sm"><Avatar src={comment.authorProfileImageUrl} name={comment.authorName} photoClassName="ig-avatar-sm-photo" /></div>
                    <div className="ig-comment-row-main">
                      <textarea className="textarea" value={editingCommentContent} onChange={(e) => setEditingCommentContent(e.target.value)} disabled={submitting} />
                      <div className="row" style={{ marginTop: 6, gap: 6 }}><button className="btn btn-sm btn-primary" onClick={() => handleEditComment(comment.id)} disabled={submitting}>保存</button><button className="btn btn-sm btn-ghost" onClick={() => { setEditingCommentId(null); setEditingCommentContent(""); }} disabled={submitting}>キャンセル</button></div>
                    </div>
                  </div>
                ) : (
                  <div key={comment.id} className="ig-comment-row-with-avatar">
                    <div className="ig-avatar-sm"><Avatar src={comment.authorProfileImageUrl} name={comment.authorName} photoClassName="ig-avatar-sm-photo" /></div>
                    <div className="ig-comment-row-main">
                      <div className="ig-comment-text-line"><span className="ig-comment-author">{comment.authorName || comment.authorId}</span>{comment.content}</div>
                      <div className="ig-comment-meta">{formatDateTime(comment.createdAt)}</div>
                    </div>
                    <CommentActionsMenu onEdit={() => { setEditingCommentId(comment.id); setEditingCommentContent(comment.content); }} onDelete={() => handleDeleteComment(comment.id)} />
                  </div>
                )
              ))}
              <div className="ig-comment-form">
                <div className="ig-avatar-sm"><Avatar name="講師" photoClassName="ig-avatar-sm-photo" /></div>
                <textarea className="textarea" placeholder="コメントを入力" value={newComment} onChange={(e) => setNewComment(e.target.value)} disabled={submitting} />
                <button type="button" className="ig-comment-form-submit" onClick={handleAddComment} disabled={submitting || !newComment.trim()}>送信</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
