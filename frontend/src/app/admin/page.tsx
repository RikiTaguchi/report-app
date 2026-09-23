"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, ApiError } from "@/lib/api";
import { subscribeTopic, REPORT_SUBMISSIONS_TOPIC } from "@/lib/ws";
import { Avatar } from "@/components/Avatar";
import type { TeacherResponse, StudentResponse, BlogResponse, ReportSubmittedEvent } from "@/lib/types";

interface RecentReport {
  studentId: string;
  studentName: string;
  studentProfileImageUrl: string | null;
  reportDate: string;
  submittedAt: string | null;
}

export default function AdminHomePage() {
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [blogs, setBlogs] = useState<BlogResponse[]>([]);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    return subscribeTopic<ReportSubmittedEvent>(REPORT_SUBMISSIONS_TOPIC, (event) => {
      setToast(`${event.studentName} さんが ${event.reportDate} の日報を提出しました`);
    });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [teacherList, studentList, blogList] = await Promise.all([
          adminApi.listTeachers(),
          adminApi.listStudents(),
          adminApi.listAllBlogs(),
        ]);
        setTeachers(teacherList);
        setStudents(studentList);
        setBlogs(blogList);
        const perStudent = await Promise.all(
          studentList.map(async (student) => {
            const reports = await adminApi.listReports(student.id);
            return reports
              .filter((report) => report.submittedAt)
              .map((report) => ({
                studentId: student.id,
                studentName: student.name,
                studentProfileImageUrl: student.profileImageUrl,
                reportDate: report.reportDate,
                submittedAt: report.submittedAt,
              }));
          })
        );
        setRecentReports(
          perStudent
            .flat()
            .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""))
            .slice(0, 8)
        );
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "概要の読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="page spinner-page">読み込み中...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>ホーム</h1>
      </div>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="admin-stat-grid">
        <Link href="/admin/teachers" className="card admin-stat-card">
          <div className="muted">講師</div>
          <strong>{teachers.length}</strong>
        </Link>
        <Link href="/admin/students" className="card admin-stat-card">
          <div className="muted">生徒</div>
          <strong>{students.length}</strong>
        </Link>
        <div className="card admin-stat-card">
          <div className="muted">講師ブログ</div>
          <strong>{blogs.length}</strong>
        </div>
      </div>

      <div className="card">
        <div className="section-title">最近の提出</div>
        {recentReports.length === 0 ? (
          <div className="empty-state">提出済みの日報はまだありません</div>
        ) : (
          <div className="admin-table-wrap" style={{ marginTop: 12 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>生徒</th>
                  <th>日付</th>
                  <th>提出日時</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((row) => {
                  const href = `/admin/students/${row.studentId}/reports/${row.reportDate}`;
                  return (
                    <tr key={`${row.studentId}-${row.reportDate}`}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Avatar
                            src={row.studentProfileImageUrl}
                            name={row.studentName}
                            photoClassName="ig-avatar-sm-photo"
                            textClassName="ig-avatar-sm"
                          />
                          <Link className="admin-muted-link" href={href}>
                            {row.studentName}
                          </Link>
                        </div>
                      </td>
                      <td>
                        <Link className="admin-muted-link" href={href}>
                          {row.reportDate}
                        </Link>
                      </td>
                      <td>
                        {row.submittedAt
                          ? new Date(row.submittedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
