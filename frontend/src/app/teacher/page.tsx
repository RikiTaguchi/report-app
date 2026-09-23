"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { teacherApi, ApiError } from "@/lib/api";
import { subscribeTopic, REPORT_SUBMISSIONS_TOPIC } from "@/lib/ws";
import { Avatar } from "@/components/Avatar";
import { TeacherReportCard, type TeacherReportFeedItem } from "@/components/TeacherReportCard";
import type { DailyReportListItemResponse, ReportSubmittedEvent, StudentResponse } from "@/lib/types";

interface ReportRow extends DailyReportListItemResponse {
  studentId: string;
  studentName: string;
  studentProfileImageUrl: string | null;
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
  const [reports, setReports] = useState<TeacherReportFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const all = await teacherApi.listAllStudents();
        const rows = (
          await Promise.all(
            all.map(async (student: StudentResponse) => {
              const studentReports = await teacherApi.listReports(student.id);
              return studentReports
                .filter((report) => Boolean(report.submittedAt))
                .map((report) => ({
                  ...report,
                  studentId: student.id,
                  studentName: student.name,
                  studentProfileImageUrl: student.profileImageUrl,
                }));
            })
          )
        ).flat().sort(compareNewest);

        const feedItems = await Promise.all(
          rows.map(async (report: ReportRow) => {
            try {
              const [detail, images] = await Promise.all([
                teacherApi.getReport(report.studentId, report.reportDate),
                teacherApi.listImages(report.studentId, report.reportDate),
              ]);
              const [comments, likeStatus] = await Promise.all([
                teacherApi.listComments(report.studentId, report.reportDate),
                teacherApi.getLikeStatus(report.studentId, report.reportDate),
              ]);
              return { ...report, detail, images, comments, likeStatus };
            } catch {
              return {
                ...report,
                detail: null,
                images: [],
                comments: [],
                likeStatus: { liked: false, count: 0 },
              };
            }
          })
        );
        setReports(feedItems);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "日報一覧の読み込みに失敗しました");
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
                <Avatar
                  src={user?.profileImageUrl}
                  name={user?.name}
                  photoClassName="ig-story-avatar-photo"
                  textClassName="ig-story-avatar-inner"
                />
              </div>
            </div>
            <div className="ig-story-scroll-item-label">{user?.name ?? "講師"}</div>
          </div>
          <div className="ig-story-text">
            <div className="ig-story-title">レポート管理システム</div>
            <div className="ig-status-line">
              <span className="ig-status-line-text">全生徒の提出レポートを表示します</span>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stack">
        {reports.length === 0 ? (
          <div className="empty-state">提出済みの日報がありません</div>
        ) : (
          reports.map((report) => <TeacherReportCard key={`${report.studentId}-${report.id}`} report={report} />)
        )}
      </div>

      {toast && (
        <div className="toast-banner">
          {toast}
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 10 }} onClick={() => setToast(null)}>
            閉じる
          </button>
        </div>
      )}
    </div>
  );
}
