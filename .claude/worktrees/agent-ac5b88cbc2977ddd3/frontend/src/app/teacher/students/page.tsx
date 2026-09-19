"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { teacherApi, ApiError } from "@/lib/api";
import type { StudentResponse } from "@/lib/types";

export default function TeacherStudentsIndexPage() {
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setStudents(await teacherApi.listStudents());
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "生徒情報の読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return <div className="spinner-page">読み込み中...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>担当生徒</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {students.length === 0 ? (
        <div className="empty-state">担当生徒がありません</div>
      ) : (
        <div className="stack">
          {students.map((student) => (
            <Link
              key={student.id}
              href={`/teacher/students/${student.id}`}
              className="ig-card card-link"
              aria-label={`${student.name}さんの生徒情報を表示`}
            >
              <div className="ig-card-header">
                <div className="ig-avatar-ring">
                  <div className="ig-avatar">{student.name.slice(0, 1)}</div>
                </div>
                <div className="ig-card-header-main">
                  <div className="ig-card-header-title">{student.name}</div>
                  <div className="ig-card-header-sub">ID: {student.username}</div>
                </div>
              </div>
              <div className="ig-card-body">
                <div className="ig-view-comments-link">生徒情報と日報を確認する</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
