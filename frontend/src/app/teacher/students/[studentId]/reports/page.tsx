"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { teacherApi, ApiError } from "@/lib/api";
import { ChevronLeftIcon } from "@/components/icons";

interface Params {
  studentId: string;
}

interface StatusRow {
  date: string;
  submitted: boolean;
}

function todayInJapan(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
}

function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

function datesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
    dates.push(date);
  }
  return dates;
}

function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });
}

export default function StudentReportsPage({ params }: { params: Promise<Params> }) {
  const { studentId } = use(params);
  const router = useRouter();
  const [rows, setRows] = useState<StatusRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [goals, reports] = await Promise.all([
          teacherApi.goals.list(studentId),
          teacherApi.listReports(studentId),
        ]);
        const today = todayInJapan();
        const submittedDates = new Set(
          reports.filter((report) => Boolean(report.submittedAt)).map((report) => report.reportDate)
        );
        const dates = new Set<string>();
        for (const goal of goals.filter((goal) => goal.isCurrent)) {
          const endDate = goal.endDate < today ? goal.endDate : today;
          if (goal.startDate > endDate) continue;
          for (const date of datesInRange(goal.startDate, endDate)) {
            dates.add(date);
          }
        }
        setRows(
          [...dates]
            .sort((a, b) => b.localeCompare(a))
            .map((date) => ({ date, submitted: submittedDates.has(date) }))
        );
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("提出状況の読み込みに失敗しました");
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
      <button
        type="button"
        className="ig-profile-back-button"
        onClick={() => router.push(`/teacher/students/${studentId}`)}
        aria-label="生徒詳細へ戻る"
      >
        <ChevronLeftIcon />
        <span>生徒詳細へ戻る</span>
      </button>

      <div className="page-header">
        <h1>レポート提出状況</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {rows.length === 0 ? (
        <div className="empty-state">現在の目標期間がありません</div>
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
              {rows.map((row) => (
                <tr key={row.date}>
                  <td>{formatDate(row.date)}</td>
                  <td>
                    <span className={`badge ${row.submitted ? "badge-success" : "badge-muted"}`}>
                      {row.submitted ? "提出" : "未提出"}
                    </span>
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
