"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { teacherApi, ApiError } from "@/lib/api";

export default function TeacherStudentsIndexPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const own = await teacherApi.listStudents();
        if (own.length > 0) {
          router.replace(`/teacher/students/${own[0].id}`);
          return;
        }
        const all = await teacherApi.listAllStudents();
        if (all.length > 0) {
          router.replace(`/teacher/students/${all[0].id}`);
          return;
        }
        setError("生徒が登録されていません");
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "生徒情報の読み込みに失敗しました");
      }
    }

    load();
  }, [router]);

  if (error) {
    return (
      <div className="page">
        <div className="empty-state">{error}</div>
      </div>
    );
  }

  return <div className="spinner-page">読み込み中...</div>;
}
