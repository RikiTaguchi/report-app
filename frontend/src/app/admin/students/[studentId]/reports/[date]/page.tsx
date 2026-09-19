"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminApi, ApiError, resolveFileUrl } from "@/lib/api";
import type { DailyReportDetailResponse, ReportImageResponse } from "@/lib/types";

export default function AdminReportMonitorPage({
  params,
}: {
  params: Promise<{ studentId: string; date: string }>;
}) {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState("");
  const [report, setReport] = useState<DailyReportDetailResponse | null>(null);
  const [images, setImages] = useState<ReportImageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((value) => {
      setStudentId(value.studentId);
      setDate(value.date);
    });
  }, [params]);

  useEffect(() => {
    if (!studentId || !date) return;
    Promise.all([adminApi.getReport(studentId, date), adminApi.listImages(studentId, date)])
      .then(([reportData, imageList]) => {
        setReport(reportData);
        setImages(imageList);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "日報の読み込みに失敗しました"))
      .finally(() => setLoading(false));
  }, [studentId, date]);

  async function handleDelete() {
    if (!window.confirm("この日報を削除しますか？")) return;
    try {
      await adminApi.deleteReport(studentId, date);
      router.push(`/admin/students/${studentId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "日報の削除に失敗しました");
    }
  }

  if (loading) return <div className="page spinner-page">読み込み中...</div>;
  if (!report) {
    return (
      <div className="page">
        <div className="alert alert-error">{error || "日報が見つかりません"}</div>
        <Link href={`/admin/students/${studentId}`} className="btn btn-ghost">戻る</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{report.reportDate} の日報</h1>
        <div className="row">
          <button className="btn btn-danger btn-sm" onClick={() => void handleDelete()}>削除</button>
          <Link href={`/admin/students/${studentId}`} className="btn btn-ghost btn-sm">生徒詳細へ戻る</Link>
        </div>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="card">
        <div className="section-title">学習内容</div>
        <div className="stack" style={{ marginTop: 8 }}>
          {report.items.length === 0 ? (
            <div className="muted">項目なし</div>
          ) : (
            report.items.map((item) => (
              <div key={item.reportItemDefinitionId}>
                <div className="label">{item.label}</div>
                <div>{item.checked ? "チェック済み" : "未チェック"}</div>
              </div>
            ))
          )}
        </div>
      </div>
      {report.freeText && (
        <div className="card">
          <div className="section-title">自由記述</div>
          <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{report.freeText}</div>
        </div>
      )}
      {report.studyTimes.length > 0 && (
        <div className="card">
          <div className="section-title">学習時間</div>
          <table className="data-table">
            <thead>
              <tr><th>教科</th><th>分</th></tr>
            </thead>
            <tbody>
              {report.studyTimes.map((item) => (
                <tr key={item.subjectId}>
                  <td>{item.subjectName}</td>
                  <td>{item.minutes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
