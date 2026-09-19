"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { teacherApi, ApiError } from "@/lib/api";
import type { DailyReportListItemResponse, StudentResponse } from "@/lib/types";

interface ReportRow extends DailyReportListItemResponse {
  studentId: string;
  studentName: string;
  isOwnStudent: boolean;
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

function StudentStory({ student }: { student: StudentResponse }) {
  return (
    <div className="ig-story-scroll-item">
      <div className="ig-story-avatar-ring">
        <div className="ig-story-avatar">
          <div className="ig-story-avatar-inner">{student.name.slice(0, 1) || "?"}</div>
        </div>
      </div>
      <div className="ig-story-scroll-item-label">{student.name}</div>
    </div>
  );
}

export default function TeacherReportsPage() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [ownOnly, setOwnOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [own, all] = await Promise.all([teacherApi.listStudents(), teacherApi.listAllStudents()]);
        const ownIds = new Set(own.map((s) => s.id));
        const perStudent = await Promise.all(
          all.map(async (s: StudentResponse) => {
            const reports = await teacherApi.listReports(s.id);
            return reports.map((r) => ({
              ...r,
              studentId: s.id,
              studentName: s.name,
              isOwnStudent: ownIds.has(s.id),
            }));
          })
        );
        setStudents(all);
        setRows(perStudent.flat());
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "日報一覧の読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return <div className="spinner-page">読み込み中...</div>;
  }

  const visibleRows = [...rows]
    .filter((r) => r.submittedAt && (!ownOnly || r.isOwnStudent))
    .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));

  return (
    <div className="page">
      <div className="page-header" style={{ width: "100%", maxWidth: 480, margin: "0 auto" }}>
        <h1>生徒日報</h1>
      </div>

      {error && (
        <div className="alert alert-error" style={{ width: "100%", maxWidth: 480, margin: "0 auto" }}>
          {error}
        </div>
      )}

      <div
        className="ig-story-section"
        style={{ width: "100%", maxWidth: 480, margin: "0 auto" }}
      >
        <div className="ig-story-row" style={{ alignItems: "flex-start" }}>
          <div className="ig-story-scroll">
            <div className="ig-story-scroll-item">
              <div className="ig-story-avatar-ring">
                <div className="ig-story-avatar">
                  <div className="ig-story-avatar-inner">全</div>
                </div>
              </div>
              <div className="ig-story-scroll-item-label">全生徒</div>
            </div>
            {students.map((student) => (
              <StudentStory key={student.id} student={student} />
            ))}
          </div>
          <div className="ig-story-row-controls-vertical">
            <label className="checkbox-row">
              <input type="checkbox" checked={ownOnly} onChange={(e) => setOwnOnly(e.target.checked)} />
              <span className="label">担当のみ</span>
            </label>
            <span className="muted" style={{ fontSize: "0.72rem", whiteSpace: "nowrap" }}>
              {visibleRows.length}件
            </span>
          </div>
        </div>
      </div>

      {visibleRows.length === 0 ? (
        <div className="empty-state" style={{ width: "100%", maxWidth: 480, margin: "0 auto" }}>
          日報がありません
        </div>
      ) : (
        <div className="stack" style={{ width: "100%", maxWidth: 480, margin: "0 auto", gap: 0 }}>
          {visibleRows.map((r) => (
            <article key={`${r.studentId}-${r.id}`} className="ig-card" style={{ margin: 0, width: "100%" }}>
              <div className="ig-card-header">
                <div className="ig-avatar" aria-hidden="true">
                  {r.studentName.slice(0, 1) || "?"}
                </div>
                <div className="ig-card-header-main">
                  <div className="ig-card-header-title">
                    <Link
                      href={`/teacher/students/${r.studentId}`}
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      {r.studentName}
                    </Link>
                  </div>
                  <div className="ig-card-header-sub">
                    {r.submittedAt ? `提出: ${formatDateTime(r.submittedAt)}` : ""}
                  </div>
                </div>
                <div className="ig-card-header-actions">
                  <span className="badge badge-success">提出済み</span>
                </div>
              </div>

              <div className="ig-card-body" style={{ paddingTop: 0 }}>
                <Link
                  href={`/teacher/students/${r.studentId}/reports/${r.reportDate}`}
                  style={{ color: "inherit", textDecoration: "none", fontWeight: 700 }}
                >
                  {formatDate(r.reportDate)}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
