"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, ApiError } from "@/lib/api";
import type { StudentResponse, TeacherResponse } from "@/lib/types";

const FLASH: Record<string, string> = {
  created: "講師を登録しました",
  deleted: "講師を削除しました",
};

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
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
    Promise.all([adminApi.listTeachers(), adminApi.listStudents()])
      .then(([teacherList, studentList]) => {
        setTeachers(teacherList);
        setStudents(studentList);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "講師一覧の読み込みに失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page spinner-page">読み込み中...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>講師管理</h1>
        <Link href="/admin/teachers/new" className="btn btn-primary">新規登録</Link>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {flash && <div className="alert alert-success">{flash}</div>}
      {teachers.length === 0 ? (
        <div className="empty-state">講師が登録されていません</div>
      ) : (
        <div className="card admin-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>氏名</th>
                <th>ユーザー名</th>
                <th>担当生徒</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td>
                    <Link className="admin-muted-link" href={`/admin/teachers/${teacher.id}`}>
                      {teacher.name}
                    </Link>
                  </td>
                  <td>{teacher.username}</td>
                  <td>{students.filter((student) => student.teacherId === teacher.id).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
