"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { teacherApi, ApiError } from "@/lib/api";
import { Avatar } from "@/components/Avatar";
import { TeacherReportCard, type TeacherReportFeedItem } from "@/components/TeacherReportCard";
import type { StudentResponse } from "@/lib/types";

export default function TeacherStudentsIndexPage() {
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [reports, setReports] = useState<TeacherReportFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const assignedStudents = await teacherApi.listStudents();
        setStudents(assignedStudents);

        const rows = (
          await Promise.all(
            assignedStudents.map(async (student) => {
              const studentReports = await teacherApi.listReports(student.id);
              return studentReports
                .filter((report) => Boolean(report.submittedAt))
                .map((report) => ({
                  ...report,
                  studentId: student.id,
                  studentName: student.name,
                  studentProfileImageUrl: student.profileImageUrl,
                }));
            })
          )
        ).flat().sort((a, b) => {
          const submittedAtDifference =
            new Date(b.submittedAt ?? 0).getTime() - new Date(a.submittedAt ?? 0).getTime();
          if (submittedAtDifference !== 0) return submittedAtDifference;
          return b.reportDate.localeCompare(a.reportDate);
        });

        const feedItems = await Promise.all(
          rows.map(async (report) => {
            try {
              const [detail, images] = await Promise.all([
                teacherApi.getReport(report.studentId, report.reportDate),
                teacherApi.listImages(report.studentId, report.reportDate),
              ]);
              const [comments, likeStatus] = await Promise.all([
                teacherApi.listComments(report.studentId, report.reportDate),
                teacherApi.getLikeStatus(report.studentId, report.reportDate),
              ]);
              return { ...report, detail, images, comments, likeStatus };
            } catch {
              return {
                ...report,
                detail: null,
                images: [],
                comments: [],
                likeStatus: { liked: false, count: 0 },
              };
            }
          })
        );
        setReports(feedItems);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "生徒情報の読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return <div className="spinner-page">読み込み中...</div>;
  }

  return (
    <div className="page">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="ig-story-section">
        <div className="ig-story-row">
          <div className="ig-story-scroll">
            {students.map((student) => (
              <Link
                key={student.id}
                href={`/teacher/students/${student.id}`}
                className="ig-story-scroll-item"
                aria-label={`${student.name}さんの生徒詳細を表示`}
                style={{ color: "inherit", textDecoration: "none" }}
              >
                <div className="ig-story-avatar-ring">
                  <div className="ig-story-avatar">
                    <Avatar
                      src={student.profileImageUrl}
                      name={student.name}
                      photoClassName="ig-story-avatar-photo"
                      textClassName="ig-story-avatar-inner"
                    />
                  </div>
                </div>
                <div className="ig-story-scroll-item-label">{student.name}</div>
              </Link>
            ))}
          </div>
          <div className="ig-story-text">
            <div className="ig-story-title">担当生徒</div>
            <div className="ig-status-line">
              <span className="ig-status-line-text">担当生徒の提出レポートを表示します</span>
            </div>
          </div>
        </div>
      </div>

      <div className="stack">
        {reports.length === 0 ? (
          <div className="empty-state">担当生徒の提出済み日報がありません</div>
        ) : (
          reports.map((report) => <TeacherReportCard key={`${report.studentId}-${report.id}`} report={report} />)
        )}
      </div>
    </div>
  );
}
