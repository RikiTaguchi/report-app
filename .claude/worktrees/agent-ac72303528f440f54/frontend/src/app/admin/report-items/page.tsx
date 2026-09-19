"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { adminApi } from "@/lib/api";
import { ReportItemsManager } from "@/components/ReportItemsManager";

function AdminReportItemsContent() {
  const searchParams = useSearchParams();
  const initialStudentId = searchParams.get("studentId") ?? undefined;

  return (
    <ReportItemsManager
      listStudents={adminApi.listStudents}
      goals={adminApi.goals}
      reportItemGroups={adminApi.reportItemGroups}
      initialStudentId={initialStudentId}
    />
  );
}

export default function AdminReportItemsPage() {
  return (
    <Suspense fallback={<div className="spinner-page">読み込み中...</div>}>
      <AdminReportItemsContent />
    </Suspense>
  );
}
