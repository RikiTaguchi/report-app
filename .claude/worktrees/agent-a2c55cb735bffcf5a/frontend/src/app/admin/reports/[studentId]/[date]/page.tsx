"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminApi, ApiError, resolveFileUrl } from "@/lib/api";
import { subscribeTopic, reportCommentsTopic } from "@/lib/ws";
import type { DailyReportDetailResponse, ReportCommentResponse, ReportImageResponse, CommentEvent } from "@/lib/types";

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ studentId: string; date: string }>;
}) {
  const router = useRouter();
  const [studentId, setStudentId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [report, setReport] = useState<DailyReportDetailResponse | null>(null);
  const [comments, setComments] = useState<ReportCommentResponse[]>([]);
  const [images, setImages] = useState<ReportImageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const resolvedParams = await params;
      setStudentId(resolvedParams.studentId);
      setDate(resolvedParams.date);
    })();
  }, [params]);

  useEffect(() => {
    if (!studentId || !date) return;
    loadReportData();
  }, [studentId, date]);

  useEffect(() => {
    if (!studentId || !date) return;
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

  async function loadReportData() {
    setLoading(true);
    setError(null);
    try {
      const [r, c, i] = await Promise.all([
        adminApi.getReport(studentId, date),
        adminApi.listComments(studentId, date),
        adminApi.listImages(studentId, date),
      ]);
      setReport(r);
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

  async function handleDeleteReport() {
    if (!window.confirm("この日報を削除してもよろしいですか?")) return;
    try {
      await adminApi.deleteReport(studentId, date);
      router.push("/admin/reports");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!window.confirm("このコメントを削除してもよろしいですか?")) return;
    try {
      await adminApi.deleteReportComment(studentId, date, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    }
  }


  if (loading) {
    return <div className="page spinner-page">読み込み中...</div>;
  }

  if (!report) {
    return (
      <div className="page">
        <div className="alert alert-error">{error || "日報が見つかりません"}</div>
        <Link href="/admin/reports" className="btn btn-ghost">
          戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>日報詳細</h1>
        <div className="row">
          <button className="btn btn-danger btn-sm" onClick={handleDeleteReport}>
            日報を削除
          </button>
          <Link href="/admin/reports" className="btn btn-ghost btn-sm">
            戻る
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="card">
        <div className="row-between">
          <div>
            <div className="section-title">
              {new Date(report.reportDate).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
            </div>
            {report.submittedAt && (
              <div className="muted" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                提出日時: {new Date(report.submittedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
              </div>
            )}
          </div>
          <div>
            <span className="badge badge-success">提出済み</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">学習内容</div>
        <div className="stack">
          {report.items.length > 0 ? (
            report.items.map((item) => (
              <div key={item.reportItemDefinitionId}>
                <div className="label">{item.label}</div>
                {item.itemType === "CHECKBOX" ? (
                  <div style={{ marginTop: "6px", fontSize: "0.9rem" }}>
                    {item.checked ? "✓ チェック済み" : "未チェック"}
                  </div>
                ) : (
                  <div
                    style={{
                      marginTop: "6px",
                      fontSize: "0.9rem",
                      whiteSpace: "pre-wrap",
                      wordWrap: "break-word",
                    }}
                  >
                    {item.textValue || "（なし）"}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="muted">項目なし</div>
          )}
        </div>
      </div>

      {report.studyTimes.length > 0 && (
        <div className="card">
          <div className="section-title">学習時間</div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>教科</th>
                  <th>分</th>
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

      {images.length > 0 && (
        <div className="card">
          <div className="section-title">画像</div>
          <div className="image-grid">
            {images.map((img) => (
              <div key={img.id} className="image-tile">
                <img
                  src={resolveFileUrl(img.imageUrl)}
                  alt="日報画像"
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
            {comments.map((comment) => (
              <div key={comment.id} className="comment">
                <div className="comment-meta row-between">
                  <div>
                    <span>{comment.authorName || "講師"}</span>{" "}
                    <span>{new Date(comment.createdAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</span>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteComment(comment.id)}>
                    削除
                  </button>
                </div>
                <div style={{ fontSize: "0.9rem", whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
                  {comment.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: "20px" }}>
        <Link href="/admin/reports" className="btn btn-ghost">
          戻る
        </Link>
      </div>
    </div>
  );
}
