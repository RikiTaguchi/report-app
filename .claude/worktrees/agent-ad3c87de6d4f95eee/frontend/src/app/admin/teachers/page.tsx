"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { adminApi, ApiError } from "@/lib/api";
import type { BlogResponse, StudentResponse, TeacherResponse } from "@/lib/types";

const MSG_LABEL: Record<string, string> = {
  created: "講師を作成しました",
  updated: "講師情報を更新しました",
  reset: "パスワードを再設定しました",
};

function AdminTeachersContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialTeacherId = searchParams.get("teacherId") ?? undefined;

  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [blogs, setBlogs] = useState<BlogResponse[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [teacherList, studentList, blogList] = await Promise.all([
          adminApi.listTeachers(),
          adminApi.listStudents(),
          adminApi.listAllBlogs(),
        ]);
        setTeachers(teacherList);
        setStudents(studentList);
        setBlogs(blogList);
        if (initialTeacherId && teacherList.some((t) => t.id === initialTeacherId)) {
          setSelectedTeacherId(initialTeacherId);
        } else if (teacherList.length > 0) {
          setSelectedTeacherId(teacherList[0].id);
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [initialTeacherId]);

  useEffect(() => {
    const msg = searchParams.get("msg");
    if (msg && MSG_LABEL[msg]) {
      setSuccessMsg(MSG_LABEL[msg]);
      router.replace(pathname);
    }
  }, [pathname, router, searchParams]);

  async function handleDeleteBlog(blogId: string) {
    if (!window.confirm("このブログを削除してもよろしいですか?")) return;
    try {
      await adminApi.deleteBlog(blogId);
      setBlogs((prev) => prev.filter((b) => b.id !== blogId));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    }
  }

  if (loading) {
    return <div className="page spinner-page">読み込み中...</div>;
  }

  const teacher = teachers.find((t) => t.id === selectedTeacherId);
  const ownStudents = students.filter((s) => s.teacherId === selectedTeacherId);
  const ownBlogs = blogs
    .filter((b) => b.teacherId === selectedTeacherId)
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  return (
    <div className="page">
      <div className="page-header">
        <h1>講師情報</h1>
        <Link href="/admin/teachers/new" className="btn btn-primary">
          新規登録
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="card">
        <div className="field">
          <label className="label">講師を選択</label>
          <select
            className="select"
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
          >
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {teacher && (
          <div className="stack-sm" style={{ marginTop: "12px" }}>
            <div>
              <span className="label">氏名: </span>
              {teacher.name}
            </div>
            <div>
              <span className="label">ユーザー名: </span>
              {teacher.username}
            </div>
            <div>
              <span className="label">作成日時: </span>
              {new Date(teacher.createdAt).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
            </div>
          </div>
        )}

        {teacher && (
          <div className="row" style={{ marginTop: "14px" }}>
            <Link className="btn btn-sm btn-ghost" href={`/admin/teachers/${teacher.id}/edit`}>
              編集
            </Link>
            <Link className="btn btn-sm btn-ghost" href={`/admin/teachers/${teacher.id}/reset-password`}>
              パスワード再設定
            </Link>
          </div>
        )}
      </div>

      {teacher && (
        <div className="card">
          <div className="section-title">担当生徒</div>
          {ownStudents.length === 0 ? (
            <div className="empty-state">担当生徒がいません</div>
          ) : (
            <div className="stack" style={{ marginTop: "10px" }}>
              {ownStudents.map((s) => (
                <Link key={s.id} href={`/admin/students?studentId=${s.id}`}>
                  {s.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {teacher && (
        <div className="card">
          <div className="section-title">ブログ</div>
          {ownBlogs.length === 0 ? (
            <div className="empty-state">ブログがありません</div>
          ) : (
            <div className="stack" style={{ marginTop: "10px" }}>
              {ownBlogs.map((blog) => (
                <div key={blog.id} className="row-between">
                  <div>
                    <div style={{ fontWeight: 600 }}>{blog.title}</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                      {blog.publishedAt ? (
                        <span className="badge badge-success">公開</span>
                      ) : (
                        <span className="badge badge-muted">下書き</span>
                      )}{" "}
                      {new Date(blog.createdAt).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                    </div>
                  </div>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteBlog(blog.id)}>
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {teachers.length === 0 && <div className="empty-state">講師がいません</div>}
    </div>
  );
}

export default function AdminTeachersPage() {
  return (
    <Suspense fallback={<div className="page spinner-page">読み込み中...</div>}>
      <AdminTeachersContent />
    </Suspense>
  );
}
