"use client";

import { Suspense, use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { teacherApi, ApiError } from "@/lib/api";
import { TeacherGoalForm } from "@/components/TeacherGoalForm";
import type { GoalFormResponse } from "@/lib/types";

function EditGoalContent({ goalId }: { goalId: string }) {
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId") ?? "";
  const [initial, setInitial] = useState<GoalFormResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    teacherApi.goalForms.get(studentId, goalId)
      .then(setInitial)
      .catch((err) => setError(err instanceof ApiError ? err.message : "目標の読み込みに失敗しました"))
      .finally(() => setLoading(false));
  }, [studentId, goalId]);

  if (!studentId) return <div className="page ig-goal-page ig-goal-form-page"><div className="alert alert-error" role="alert">生徒が指定されていません</div></div>;
  if (loading) return <div className="spinner-page">読み込み中...</div>;
  if (error || !initial) return <div className="page ig-goal-page ig-goal-form-page"><div className="alert alert-error" role="alert">{error ?? "目標が見つかりません"}</div></div>;
  return <TeacherGoalForm studentId={studentId} goalId={goalId} initial={initial} />;
}

export default function EditGoalPage({ params }: { params: Promise<{ goalId: string }> }) {
  const { goalId } = use(params);
  return <Suspense fallback={<div className="spinner-page">読み込み中...</div>}><EditGoalContent goalId={goalId} /></Suspense>;
}
