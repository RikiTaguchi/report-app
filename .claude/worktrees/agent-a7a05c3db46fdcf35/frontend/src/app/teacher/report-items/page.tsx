"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { teacherApi } from "@/lib/api";
import { ReportItemsManager } from "@/components/ReportItemsManager";

function TeacherReportItemsContent() {
  const searchParams = useSearchParams();
  const initialStudentId = searchParams.get("studentId") ?? undefined;

  return (
    <ReportItemsManager
      listStudents={teacherApi.listStudents}
      goals={teacherApi.goals}
      reportItemGroups={teacherApi.reportItemGroups}
      initialStudentId={initialStudentId}
    />
  );
}

export default function TeacherReportItemsPage() {
  return (
    <Suspense fallback={<div className="spinner-page">読み込み中...</div>}>
      <TeacherReportItemsContent />
    </Suspense>
  );
}
