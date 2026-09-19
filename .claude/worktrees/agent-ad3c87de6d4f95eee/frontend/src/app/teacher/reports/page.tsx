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

export default function TeacherReportsPage() {
  const [rows, setRows] = useState<ReportRow[]>([]);
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
        setRows(perStudent.flat());
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "日報一覧の読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const visibleRows = (ownOnly ? rows.filter((r) => r.isOwnStudent) : rows)
    .filter((r) => r.submittedAt)
    .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));

  if (loading) {
    return <div className="spinner-page">読み込み中...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>生徒日報</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <label className="row" style={{ gap: 8, alignItems: "center" }}>
          <input type="checkbox" checked={ownOnly} onChange={(e) => setOwnOnly(e.target.checked)} />
          自分の担当生徒のみ表示
        </label>
      </div>

      {visibleRows.length === 0 ? (
        <div className="empty-state">日報がありません</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>生徒</th>
                <th>日付</th>
                <th>提出日時</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((r) => (
                <tr key={`${r.studentId}-${r.id}`}>
                  <td>
                    <Link href={`/teacher/students/${r.studentId}`}>{r.studentName}</Link>
                  </td>
                  <td>
                    <Link href={`/teacher/students/${r.studentId}/reports/${r.reportDate}`}>
                      {new Date(r.reportDate).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                    </Link>
                  </td>
                  <td style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                    {r.submittedAt ? new Date(r.submittedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
