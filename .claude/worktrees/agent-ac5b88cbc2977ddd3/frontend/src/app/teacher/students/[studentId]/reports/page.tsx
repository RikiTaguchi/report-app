"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { teacherApi, ApiError } from "@/lib/api";
import type { DailyReportListItemResponse } from "@/lib/types";

interface Params {
  studentId: string;
}

export default function StudentReportsPage({ params }: { params: Promise<Params> }) {
  const { studentId } = use(params);
  const router = useRouter();
  const [reports, setReports] = useState<DailyReportListItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await teacherApi.listReports(studentId);
        setReports(data);
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
  }, [studentId]);

  if (loading) {
    return <div className="spinner-page">読み込み中...</div>;
  }

  return (
    <div className="page">
      <div className="breadcrumb">
        <Link href="/teacher">生徒一覧</Link>
        <span>/</span>
        <span>日報一覧</span>
      </div>

      <div className="page-header">
        <h1>日報一覧</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {reports.length === 0 ? (
        <div className="empty-state">日報がありません</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>日付</th>
                <th>提出状況</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>
                    <Link href={`/teacher/students/${studentId}/reports/${report.reportDate}`}>
                      {new Date(report.reportDate).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                    </Link>
                  </td>
                  <td>
                    <span className="badge badge-success">提出</span>
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
