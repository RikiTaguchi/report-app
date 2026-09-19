"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { teacherApi, ApiError } from "@/lib/api";
import { TeacherGoalForm } from "@/components/TeacherGoalForm";
import type { StudentResponse } from "@/lib/types";

function NewGoalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId") ?? "";
  const [student, setStudent] = useState<StudentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) {
      router.replace("/teacher/students");
      return;
    }

    teacherApi.listStudents()
      .then((data) => {
        const match = data.find((item) => item.id === studentId);
        if (!match) {
          router.replace("/teacher/students");
          return;
        }
        setStudent(match);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "生徒情報の読み込みに失敗しました"))
      .finally(() => setLoading(false));
  }, [router, studentId]);

  if (!studentId || loading) return <div className="spinner-page">読み込み中...</div>;
  if (error) return <div className="page ig-goal-page ig-goal-form-page"><div className="alert alert-error" role="alert">{error}</div></div>;
  if (!student) return <div className="spinner-page">読み込み中...</div>;
  return <TeacherGoalForm studentId={student.id} studentName={student.name} />;
}

export default function NewGoalPage() {
  return <Suspense fallback={<div className="spinner-page">読み込み中...</div>}><NewGoalContent /></Suspense>;
}
