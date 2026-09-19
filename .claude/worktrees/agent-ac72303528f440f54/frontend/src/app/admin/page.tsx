"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, ApiError } from "@/lib/api";
import { subscribeTopic, REPORT_SUBMISSIONS_TOPIC } from "@/lib/ws";
import type { TeacherResponse, StudentResponse, BlogResponse, ReportSubmittedEvent } from "@/lib/types";

export default function AdminOverviewPage() {
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [blogs, setBlogs] = useState<BlogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showTeachers, setShowTeachers] = useState(false);
  const [showStudents, setShowStudents] = useState(false);

  useEffect(() => {
    return subscribeTopic<ReportSubmittedEvent>(REPORT_SUBMISSIONS_TOPIC, (event) => {
      setToast(`${event.studentName} さんが ${event.reportDate} の日報を提出しました`);
    });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [t, s, b] = await Promise.all([
          adminApi.listTeachers(),
          adminApi.listStudents(),
          adminApi.listAllBlogs(),
        ]);
        setTeachers(t);
        setStudents(s);
        setBlogs(b);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="page spinner-page">読み込み中...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>概要</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid-cards">
        <div className="card">
          <div className="section-title">講師管理</div>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--accent)" }}>
            {teachers.length}
          </div>
          <div className="muted" style={{ fontSize: "0.85rem" }}>講師</div>
          <div className="row" style={{ marginTop: "10px" }}>
            <button className="btn btn-sm btn-ghost" onClick={() => setShowTeachers(!showTeachers)}>
              {showTeachers ? "一覧を閉じる" : "一覧を表示"}
            </button>
            <Link href="/admin/teachers" className="btn btn-sm btn-ghost">
              講師情報ページへ
            </Link>
          </div>
          {showTeachers && (
            <div className="stack-sm" style={{ marginTop: "10px" }}>
              {teachers.map((t) => (
                <Link key={t.id} href={`/admin/teachers?teacherId=${t.id}`}>
                  {t.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-title">生徒管理</div>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--accent)" }}>
            {students.length}
          </div>
          <div className="muted" style={{ fontSize: "0.85rem" }}>生徒</div>
          <div className="row" style={{ marginTop: "10px" }}>
            <button className="btn btn-sm btn-ghost" onClick={() => setShowStudents(!showStudents)}>
              {showStudents ? "一覧を閉じる" : "一覧を表示"}
            </button>
            <Link href="/admin/students" className="btn btn-sm btn-ghost">
              生徒情報ページへ
            </Link>
          </div>
          {showStudents && (
            <div className="stack-sm" style={{ marginTop: "10px" }}>
              {students.map((s) => (
                <Link key={s.id} href={`/admin/students?studentId=${s.id}`}>
                  {s.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link href="/admin/reports" className="card card-link">
          <div className="section-title">生徒日報</div>
          <div className="muted" style={{ fontSize: "0.85rem" }}>提出状況を確認</div>
        </Link>

        <Link href="/admin/blogs" className="card card-link">
          <div className="section-title">ブログ</div>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--accent)" }}>
            {blogs.length}
          </div>
          <div className="muted" style={{ fontSize: "0.85rem" }}>ブログ記事</div>
        </Link>
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
