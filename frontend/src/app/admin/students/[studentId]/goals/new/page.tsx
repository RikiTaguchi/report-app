"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { AdminGoalForm } from "@/components/AdminGoalForm";

export default function AdminNewGoalPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState<string>();

  useEffect(() => {
    params.then((value) => setStudentId(value.studentId));
  }, [params]);

  useEffect(() => {
    if (!studentId) return;
    adminApi.getStudent(studentId).then((student) => setStudentName(student.name)).catch(() => undefined);
  }, [studentId]);

  if (!studentId) return <div className="page spinner-page">読み込み中...</div>;
  return <AdminGoalForm studentId={studentId} studentName={studentName} />;
}
