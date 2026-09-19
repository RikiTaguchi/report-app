"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminApi, ApiError } from "@/lib/api";
import type { BlogResponse, StudentResponse, TeacherResponse } from "@/lib/types";

export default function AdminTeacherDetailPage({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}) {
  const router = useRouter();
  const [teacherId, setTeacherId] = useState("");
  const [teacher, setTeacher] = useState<TeacherResponse | null>(null);
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [blogs, setBlogs] = useState<BlogResponse[]>([]);
  const [assignStudentId, setAssignStudentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    params.then((value) => setTeacherId(value.teacherId));
  }, [params]);

  async function load(id: string) {
    const [teacherData, teacherList, studentList, blogList] = await Promise.all([
      adminApi.getTeacher(id),
      adminApi.listTeachers(),
      adminApi.listStudents(),
      adminApi.listAllBlogs(),
    ]);
    setTeacher(teacherData);
    setTeachers(teacherList);
    setStudents(studentList);
    setBlogs(blogList.filter((blog) => blog.teacherId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }

  useEffect(() => {
    if (!teacherId) return;
    load(teacherId)
      .catch((err) => setError(err instanceof ApiError ? err.message : "講師情報の読み込みに失敗しました"))
      .finally(() => setLoading(false));
  }, [teacherId]);

  const assigned = students.filter((student) => student.teacherId === teacherId);
  const assignable = students.filter((student) => student.teacherId !== teacherId);

  async function handleAssign(event: React.FormEvent) {
    event.preventDefault();
    const student = students.find((item) => item.id === assignStudentId);
    if (!student) return;
    setError(null);
    try {
      await adminApi.updateStudent(student.id, {
        lastName: student.lastName,
        firstName: student.firstName,
        teacherId,
      });
      setMessage("担当生徒を更新しました");
      setAssignStudentId("");
      await load(teacherId);
    } catch (err) {
      setMessage(null);
      setError(err instanceof ApiError ? err.message : "担当の更新に失敗しました");
    }
  }

  async function handleReassign(student: StudentResponse, nextTeacherId: string) {
    setError(null);
    try {
      await adminApi.updateStudent(student.id, {
        lastName: student.lastName,
        firstName: student.firstName,
        teacherId: nextTeacherId,
      });
      setMessage("担当講師を変更しました");
      await load(teacherId);
    } catch (err) {
      setMessage(null);
      setError(err instanceof ApiError ? err.message : "担当の変更に失敗しました");
    }
  }

  async function handleDeleteBlog(blogId: string) {
    if (!window.confirm("このブログを削除しますか？")) return;
    try {
      setError(null);
      await adminApi.deleteBlog(blogId);
      setBlogs((prev) => prev.filter((blog) => blog.id !== blogId));
      setMessage("ブログを削除しました");
    } catch (err) {
      setMessage(null);
      setError(err instanceof ApiError ? err.message : "ブログの削除に失敗しました");
    }
  }

  async function handleDeleteTeacher() {
    if (!window.confirm("この講師を削除しますか？担当生徒がいる場合は削除できません。")) return;
    try {
      await adminApi.deleteTeacher(teacherId);
      router.push("/admin/teachers?msg=deleted");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "講師の削除に失敗しました");
    }
  }

  if (loading) return <div className="page spinner-page">読み込み中...</div>;
  if (!teacher) {
    return (
      <div className="page">
        <div className="alert alert-error">{error || "講師が見つかりません"}</div>
        <Link href="/admin/teachers" className="btn btn-ghost">戻る</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{teacher.name}</h1>
        <Link href="/admin/teachers" className="btn btn-ghost btn-sm">一覧へ戻る</Link>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="card">
        <div className="stack-sm">
          <div><span className="label">ユーザー名: </span>{teacher.username}</div>
        </div>
        <div className="row" style={{ marginTop: 14 }}>
          <Link className="btn btn-sm btn-ghost" href={`/admin/teachers/${teacher.id}/reset-password`}>
            パスワード再設定
          </Link>
          <button className="btn btn-sm btn-danger" onClick={() => void handleDeleteTeacher()}>
            講師を削除
          </button>
        </div>
      </div>

      <div className="card">
        <div className="section-title">担当生徒</div>
        {assigned.length === 0 ? (
          <div className="empty-state">担当生徒はいません</div>
        ) : (
          <div className="stack" style={{ marginTop: 10 }}>
            {assigned.map((student) => (
              <div key={student.id} className="row-between">
                <Link className="admin-muted-link" href={`/admin/students/${student.id}`}>{student.name}</Link>
                <select
                  className="select"
                  value={teacherId}
                  onChange={(event) => void handleReassign(student, event.target.value)}
                  aria-label={`${student.name}の担当講師`}
                >
                  {teachers.map((option) => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
        {assignable.length > 0 && (
          <form className="row" style={{ marginTop: 14 }} onSubmit={(event) => void handleAssign(event)}>
            <select
              className="select"
              value={assignStudentId}
              onChange={(event) => setAssignStudentId(event.target.value)}
              required
            >
              <option value="">他の講師の生徒を追加</option>
              {assignable.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}（{student.teacherName ?? "未設定"}）
                </option>
              ))}
            </select>
            <button className="btn btn-primary btn-sm" type="submit" disabled={!assignStudentId}>追加</button>
          </form>
        )}
      </div>

      <div className="card">
        <div className="section-title">ブログ（監視）</div>
        {blogs.length === 0 ? (
          <div className="empty-state">ブログはありません</div>
        ) : (
          <div className="stack" style={{ marginTop: 10 }}>
            {blogs.map((blog) => (
              <div key={blog.id} className="row-between">
                <div>
                  <Link className="admin-muted-link" href={`/admin/teachers/${teacherId}/blogs/${blog.id}`}>
                    {blog.title}
                  </Link>
                  <div className="muted" style={{ fontSize: "0.85rem" }}>
                    {new Date(blog.createdAt).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                  </div>
                </div>
                <button className="btn btn-sm btn-danger" onClick={() => void handleDeleteBlog(blog.id)}>削除</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
