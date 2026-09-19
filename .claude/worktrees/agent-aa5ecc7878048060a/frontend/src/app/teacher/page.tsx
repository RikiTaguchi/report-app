"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { teacherApi, ApiError } from "@/lib/api";
import { subscribeTopic, REPORT_SUBMISSIONS_TOPIC } from "@/lib/ws";
import type {
  DailyReportListItemResponse,
  ReportSubmittedEvent,
  StudentResponse,
} from "@/lib/types";

interface ReportRow extends DailyReportListItemResponse {
  studentId: string;
  studentName: string;
  isOwnStudent: boolean;
}

function formatReportDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  });
}

function formatSubmittedAt(dateTimeStr: string): string {
  return new Date(dateTimeStr).toLocaleString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
}

function compareNewest(a: ReportRow, b: ReportRow): number {
  const submittedAtDifference =
    new Date(b.submittedAt ?? 0).getTime() - new Date(a.submittedAt ?? 0).getTime();
  if (submittedAtDifference !== 0) return submittedAtDifference;

  const reportDateDifference = b.reportDate.localeCompare(a.reportDate);
  if (reportDateDifference !== 0) return reportDateDifference;
  return a.id.localeCompare(b.id);
}

export default function TeacherPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [own, all] = await Promise.all([teacherApi.listStudents(), teacherApi.listAllStudents()]);
        const ownIds = new Set(own.map((student) => student.id));
        const reportRows = await Promise.all(
          all.map(async (student: StudentResponse) => {
            const studentReports = await teacherApi.listReports(student.id);
            return studentReports
              .filter((report) => report.submittedAt)
              .map((report) => ({
                ...report,
                studentId: student.id,
                studentName: student.name,
                isOwnStudent: ownIds.has(student.id),
              }));
          })
        );

        setReports(reportRows.flat().sort(compareNewest));
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("日報一覧の読み込みに失敗しました");
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  useEffect(() => {
    if (!user) return;
    return subscribeTopic<ReportSubmittedEvent>(REPORT_SUBMISSIONS_TOPIC, (event) => {
      if (event.teacherId !== user.id) return;
      setToast(`${event.studentName} さんが ${event.reportDate} の日報を提出しました`);
    });
  }, [user]);

  if (loading) {
    return <div className="page"><div className="spinner-page">読み込み中...</div></div>;
  }

  return (
    <div className="page">
      <div className="ig-story-section">
        <div className="ig-story-row">
          <div className="ig-story-scroll-item">
            <div className="ig-story-avatar-ring">
              <div className="ig-story-avatar">
                <div className="ig-story-avatar-inner">日</div>
              </div>
            </div>
            <div className="ig-story-scroll-item-label">日報</div>
          </div>
          <div className="ig-story-text">
            <div className="ig-story-title">提出された日報</div>
            <div className="ig-status-line">
              <span className="ig-status-line-text">全生徒の提出履歴を新しい順に表示しています</span>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stack">
        {reports.length === 0 ? (
          <div className="empty-state">提出済みの日報がありません</div>
        ) : (
          reports.map((report) => (
            <Link
              key={`${report.studentId}-${report.id}`}
              href={`/teacher/students/${report.studentId}/reports/${report.reportDate}`}
              className="ig-card"
            >
              <div className="ig-card-header">
                <div className="ig-avatar">{report.studentName.slice(0, 1)}</div>
                <div className="ig-card-header-main">
                  <div className="ig-card-header-title">{report.studentName}</div>
                  <div className="ig-card-header-sub">
                    {formatReportDate(report.reportDate)} ・ 提出 {formatSubmittedAt(report.submittedAt!)}
                  </div>
                </div>
                <div className="ig-card-header-actions">
                  <span className="muted" style={{ fontSize: "0.8rem" }}>詳細 ›</span>
                </div>
              </div>
              <div className="ig-card-body">
                <div className="ig-section-label">日報を提出しました</div>
              </div>
            </Link>
          ))
        )}
      </div>

      {toast && (
        <div className="toast-banner">
          {toast}
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginLeft: 10 }}
            onClick={() => setToast(null)}
          >
            閉じる
          </button>
        </div>
      )}
    </div>
  );
}
