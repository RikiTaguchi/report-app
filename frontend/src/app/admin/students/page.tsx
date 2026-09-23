"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, ApiError } from "@/lib/api";
import { Avatar } from "@/components/Avatar";
import type { StudentResponse } from "@/lib/types";

const FLASH: Record<string, string> = {
  created: "生徒を登録しました",
  deleted: "生徒を削除しました",
};

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get("msg");
    if (msg && FLASH[msg]) {
      setFlash(FLASH[msg]);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    adminApi.listStudents()
      .then(setStudents)
      .catch((err) => setError(err instanceof ApiError ? err.message : "生徒一覧の読み込みに失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page spinner-page">読み込み中...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>生徒管理</h1>
        <Link href="/admin/students/new" className="btn btn-primary">新規登録</Link>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {flash && <div className="alert alert-success">{flash}</div>}
      {students.length === 0 ? (
        <div className="empty-state">生徒が登録されていません</div>
      ) : (
        <div className="card admin-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>氏名</th>
                <th>ユーザー名</th>
                <th>担当講師</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Avatar
                        src={student.profileImageUrl}
                        name={student.name}
                        photoClassName="ig-avatar-sm-photo"
                        textClassName="ig-avatar-sm"
                      />
                      <Link className="admin-muted-link" href={`/admin/students/${student.id}`}>
                        {student.name}
                      </Link>
                    </div>
                  </td>
                  <td>{student.username}</td>
                  <td>{student.teacherName ?? "未設定"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
