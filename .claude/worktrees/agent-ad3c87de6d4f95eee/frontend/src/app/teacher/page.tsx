"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { teacherApi, ApiError } from "@/lib/api";
import { subscribeTopic, REPORT_SUBMISSIONS_TOPIC } from "@/lib/ws";
import type { StudentResponse, ReportSubmittedEvent } from "@/lib/types";

export default function TeacherPage() {
  const { user } = useAuth();
  const [ownStudents, setOwnStudents] = useState<StudentResponse[]>([]);
  const [otherStudents, setOtherStudents] = useState<StudentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [own, all] = await Promise.all([teacherApi.listStudents(), teacherApi.listAllStudents()]);
        const ownIds = new Set(own.map((s) => s.id));
        setOwnStudents(own);
        setOtherStudents(all.filter((s) => !ownIds.has(s.id)));
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("生徒一覧の読み込みに失敗しました");
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
    return <div className="spinner-page">読み込み中...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>生徒一覧</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="section-title">担当生徒</div>
      {ownStudents.length === 0 ? (
        <div className="empty-state">担当生徒がありません</div>
      ) : (
        <div className="grid-cards">
          {ownStudents.map((student) => (
            <Link key={student.id} href={`/teacher/students/${student.id}`} className="card card-link">
              <div className="stack-sm">
                <div className="section-title">{student.name}</div>
                <div className="muted" style={{ fontSize: "0.85rem" }}>
                  ID: {student.username}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="section-title" style={{ marginTop: "24px" }}>
        その他の生徒
      </div>
      {otherStudents.length === 0 ? (
        <div className="empty-state">その他の生徒はいません</div>
      ) : (
        <div className="grid-cards">
          {otherStudents.map((student) => (
            <Link key={student.id} href={`/teacher/students/${student.id}`} className="card card-link">
              <div className="stack-sm">
                <div className="section-title">{student.name}</div>
                <div className="muted" style={{ fontSize: "0.85rem" }}>
                  ID: {student.username} ／ 担当: {student.teacherName || "未割り当て"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

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
