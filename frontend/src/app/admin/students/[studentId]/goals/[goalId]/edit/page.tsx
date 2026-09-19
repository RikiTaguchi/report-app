"use client";

import { useEffect, useState } from "react";
import { adminApi, ApiError } from "@/lib/api";
import { AdminGoalForm } from "@/components/AdminGoalForm";
import type { GoalFormResponse } from "@/lib/types";

export default function AdminEditGoalPage({
  params,
}: {
  params: Promise<{ studentId: string; goalId: string }>;
}) {
  const [studentId, setStudentId] = useState("");
  const [goalId, setGoalId] = useState("");
  const [studentName, setStudentName] = useState<string>();
  const [initial, setInitial] = useState<GoalFormResponse>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((value) => {
      setStudentId(value.studentId);
      setGoalId(value.goalId);
    });
  }, [params]);

  useEffect(() => {
    if (!studentId || !goalId) return;
    Promise.all([adminApi.getStudent(studentId), adminApi.goalForms.get(studentId, goalId)])
      .then(([student, form]) => {
        setStudentName(student.name);
        setInitial(form);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "目標の読み込みに失敗しました"))
      .finally(() => setLoading(false));
  }, [studentId, goalId]);

  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!studentId || !goalId) return <div className="page spinner-page">読み込み中...</div>;
  return <AdminGoalForm studentId={studentId} studentName={studentName} goalId={goalId} initial={initial} loading={loading} />;
}
