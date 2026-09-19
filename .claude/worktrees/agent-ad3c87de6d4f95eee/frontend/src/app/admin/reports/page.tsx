"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, ApiError } from "@/lib/api";
import type { StudentResponse } from "@/lib/types";

interface ReportRow {
  id: string;
  reportDate: string;
  submittedAt: string | null;
  studentId: string;
  studentName: string;
}

export default function AdminReportsPage() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const students = await adminApi.listStudents();
      const perStudent = await Promise.all(
        students.map(async (s: StudentResponse) => {
          const reports = await adminApi.listReports(s.id);
          return reports.map((r) => ({
            id: r.id,
            reportDate: r.reportDate,
            submittedAt: r.submittedAt,
            studentId: s.id,
            studentName: s.name,
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

  async function handleDelete(studentId: string, reportDate: string) {
    if (!window.confirm("この日報を削除してもよろしいですか?")) return;
    try {
      await adminApi.deleteReport(studentId, reportDate);
      setRows((prev) => prev.filter((r) => !(r.studentId === studentId && r.reportDate === reportDate)));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    }
  }

  if (loading) {
    return <div className="page spinner-page">読み込み中...</div>;
  }

  const sortedRows = rows
    .filter((r) => r.submittedAt)
    .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));

  return (
    <div className="page">
      <div className="page-header">
        <h1>生徒日報</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {sortedRows.length === 0 ? (
        <div className="empty-state">日報がありません</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>生徒</th>
                <th>日付</th>
                <th>提出日時</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((r) => (
                <tr key={`${r.studentId}-${r.id}`}>
                  <td>
                    <Link href={`/admin/students?studentId=${r.studentId}`}>{r.studentName}</Link>
                  </td>
                  <td>
                    <Link href={`/admin/reports/${r.studentId}/${r.reportDate}`}>
                      {new Date(r.reportDate).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                    </Link>
                  </td>
                  <td style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                    {r.submittedAt ? new Date(r.submittedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }) : ""}
                  </td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r.studentId, r.reportDate)}>
                      削除
                    </button>
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
