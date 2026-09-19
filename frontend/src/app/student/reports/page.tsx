"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { studentApi, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { ImageCarousel } from "@/components/ImageCarousel";
import { CommentActionsMenu } from "@/components/CommentActionsMenu";
import { HeartIcon, ChatIcon } from "@/components/icons";
import { Avatar } from "@/components/Avatar";
import type {
  DailyReportDetailResponse,
  DailyReportListItemResponse,
  ReportCommentResponse,
  ReportImageResponse,
  ReportLikeStatusResponse,
  StudentReportItemResponse,
} from "@/lib/types";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00Z");
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  });
}

function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}時間${minutes}分`;
}

function formatDateTime(dateTimeStr: string): string {
  return new Date(dateTimeStr).toLocaleString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
}

function buildSubtitleGroups(
  defs: StudentReportItemResponse[],
  detail: DailyReportDetailResponse | undefined
): { subtitleId: string; subtitleLabel: string; items: { def: StudentReportItemResponse; checked: boolean | null }[] }[] {
  const itemsMap: Record<string, { checked: boolean | null }> = {};
  detail?.items.forEach((item) => {
    itemsMap[item.reportItemDefinitionId] = { checked: item.checked };
  });

  const groups: { subtitleId: string; subtitleLabel: string; items: { def: StudentReportItemResponse; checked: boolean | null }[] }[] = [];
  for (const def of defs) {
    let group = groups.find((g) => g.subtitleId === def.subtitleId);
    if (!group) {
      group = { subtitleId: def.subtitleId, subtitleLabel: def.subtitleLabel, items: [] };
      groups.push(group);
    }
    const values = itemsMap[def.id] ?? { checked: null };
    group.items.push({ def, ...values });
  }
  return groups;
}

export default function StudentReportsList() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [reports, setReports] = useState<DailyReportListItemResponse[]>([]);
  const [detailsByDate, setDetailsByDate] = useState<Record<string, DailyReportDetailResponse>>({});
  const [defsByDate, setDefsByDate] = useState<Record<string, StudentReportItemResponse[]>>({});
  const [imagesByDate, setImagesByDate] = useState<Record<string, ReportImageResponse[]>>({});
  const [commentsByDate, setCommentsByDate] = useState<Record<string, ReportCommentResponse[]>>({});
  const [likeStatusByDate, setLikeStatusByDate] = useState<Record<string, ReportLikeStatusResponse>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openCommentsFor, setOpenCommentsFor] = useState<Record<string, boolean>>({});
  const [likingFor, setLikingFor] = useState<Record<string, boolean>>({});
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      try {
        const data = await studentApi.listReports();
        setReports(data);

        const entries = await Promise.all(
          data.map(async (r) => {
            const [detail, defs, images] = await Promise.all([
              studentApi.getReport(r.reportDate),
              studentApi.listItemDefinitions(r.reportDate),
              studentApi.listImages(r.reportDate),
            ]);
            let comments: ReportCommentResponse[] = [];
            let likeStatus: ReportLikeStatusResponse | null = null;
            if (r.submittedAt) {
              [comments, likeStatus] = await Promise.all([
                studentApi.listComments(r.reportDate),
                studentApi.getLikeStatus(r.reportDate),
              ]);
            }
            return { date: r.reportDate, detail, defs, images, comments, likeStatus };
          })
        );

        setDetailsByDate(Object.fromEntries(entries.map((e) => [e.date, e.detail])));
        setDefsByDate(Object.fromEntries(entries.map((e) => [e.date, e.defs.items])));
        setImagesByDate(Object.fromEntries(entries.map((e) => [e.date, e.images])));
        setCommentsByDate(Object.fromEntries(entries.map((e) => [e.date, e.comments])));
        setLikeStatusByDate(
          Object.fromEntries(entries.filter((e) => e.likeStatus).map((e) => [e.date, e.likeStatus!]))
        );
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("レポート一覧の読み込みに失敗しました");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDelete = async (reportDate: string) => {
    if (!window.confirm("このレポートを削除してよろしいですか？")) return;

    try {
      await studentApi.deleteReport(reportDate);
      setReports((prev) => prev.filter((r) => r.reportDate !== reportDate));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "削除に失敗しました";
      showToast(msg, "error");
    }
  };

  const handleToggleLike = async (reportDate: string) => {
    const status = likeStatusByDate[reportDate] ?? { liked: false, count: 0 };
    setLikingFor({ ...likingFor, [reportDate]: true });
    try {
      if (status.liked) {
        await studentApi.unlikeReport(reportDate);
        setLikeStatusByDate({
          ...likeStatusByDate,
          [reportDate]: { liked: false, count: status.count - 1 },
        });
      } else {
        await studentApi.likeReport(reportDate);
        setLikeStatusByDate({
          ...likeStatusByDate,
          [reportDate]: { liked: true, count: status.count + 1 },
        });
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "いいね操作に失敗しました";
      showToast(msg, "error");
    } finally {
      setLikingFor({ ...likingFor, [reportDate]: false });
    }
  };

  if (loading) {
    return <div className="page"><div className="spinner-page">読み込み中...</div></div>;
  }

  if (error && reports.length === 0) {
    return (
      <div className="page">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  const visibleReports = reports;

  return (
    <div className="page">
      <div className="ig-story-section">
        <div className="ig-story-row">
          <div className="ig-story-scroll-item">
            <div className="ig-story-avatar-ring">
              <div className="ig-story-avatar">
                <Avatar
                  src={user?.profileImageUrl}
                  name={user?.name}
                  textClassName="ig-story-avatar-inner"
                  photoClassName="ig-story-avatar-photo"
                />
              </div>
            </div>
            <div className="ig-story-scroll-item-label">{user?.name ?? ""}</div>
          </div>

          <div className="ig-story-scroll-item">
            <div className="ig-story-avatar-ring">
              <div className="ig-story-avatar">
                <img
                  src="https://picsum.photos/seed/reports-story-filler-1/100/100"
                  alt=""
                  className="ig-story-avatar-photo"
                />
              </div>
            </div>
            <div className="ig-story-scroll-item-label">???</div>
          </div>

          <div className="ig-story-scroll-item">
            <div className="ig-story-avatar-ring">
              <div className="ig-story-avatar">
                <img
                  src="https://picsum.photos/seed/reports-story-filler-2/100/100"
                  alt=""
                  className="ig-story-avatar-photo"
                />
              </div>
            </div>
            <div className="ig-story-scroll-item-label">???</div>
          </div>

          <div className="ig-story-row-controls-vertical">
            <Link href="/student/reports/_" className="btn btn-primary btn-sm">
              新規作成
            </Link>
          </div>
        </div>
      </div>

      <div className="stack">
        {visibleReports.length === 0 ? (
          <div className="empty-state">レポートがまだ記入されていません</div>
        ) : (
          visibleReports.map((report) => {
            const date = report.reportDate;
            const isSubmitted = Boolean(report.submittedAt);
            const detail = detailsByDate[date];
            const groups = buildSubtitleGroups(defsByDate[date] ?? [], detail);
            const images = imagesByDate[date] ?? [];
            const comments = commentsByDate[date] ?? [];
            const likeStatus = likeStatusByDate[date] ?? { liked: false, count: 0 };
            const commentsOpen = Boolean(openCommentsFor[date]);
            const expanded = Boolean(expandedDates[date]);
            const hasBodyContent =
              Boolean(detail?.freeText) ||
              groups.length > 0 ||
              Boolean(detail && detail.studyTimes.length > 0);

            const bodySummaryParts: string[] = [];
            if (detail?.freeText) bodySummaryParts.push(detail.freeText);
            groups.forEach((group) => {
              group.items.forEach(({ def, checked }) => {
                bodySummaryParts.push(`${checked ? "✓" : "☐"}${def.label}`);
              });
            });
            if (detail && detail.studyTimes.length > 0) {
              bodySummaryParts.push(
                `学習${formatMinutes(detail.studyTimes.reduce((sum, st) => sum + st.minutes, 0))}`
              );
            }
            const bodySummaryText = bodySummaryParts.join("　");

            return (
              <div key={report.id} className="ig-card">
                <div className="ig-card-header">
                  <div className="ig-avatar">
                    <Avatar src={user?.profileImageUrl} name={user?.name} photoClassName="ig-avatar-photo" />
                  </div>
                  <div className="ig-card-header-main">
                    <div className="ig-card-header-title">
                      <span>{formatDate(date)}</span>
                    </div>
                    <div className="ig-card-header-sub">
                      {isSubmitted
                        ? detail && `最終更新: ${formatDateTime(detail.updatedAt)}`
                        : detail && `作成: ${formatDateTime(detail.createdAt)}`}
                    </div>
                  </div>
                  <div className="ig-card-header-actions">
                    <CommentActionsMenu
                      onEdit={() => router.push(`/student/reports/${date}`)}
                      onDelete={() => handleDelete(date)}
                    />
                  </div>
                </div>

                <ImageCarousel
                  images={images}
                  altText="レポート画像"
                  fallbackSeed={`report-${date}`}
                />

                <div className="ig-card-body" style={{ paddingTop: "12px" }}>
                  {isSubmitted && (
                    <div className="ig-action-bar">
                      <button
                        className={`ig-icon-btn ${likeStatus.liked ? "liked" : ""}`}
                        onClick={() => handleToggleLike(date)}
                        disabled={likingFor[date]}
                        type="button"
                      >
                        <HeartIcon filled={likeStatus.liked} />
                        {likeStatus.count > 0 && <span>{likeStatus.count}</span>}
                      </button>
                      <button
                        className="ig-icon-btn"
                        type="button"
                        onClick={() => setOpenCommentsFor({ ...openCommentsFor, [date]: !commentsOpen })}
                      >
                        <ChatIcon />
                        {comments.length > 0 && <span>{comments.length}</span>}
                      </button>
                    </div>
                  )}

                  {hasBodyContent && !expanded && (
                    <div className="ig-body-line-row">
                      <div className="ig-body-oneline">{bodySummaryText}</div>
                      <button
                        type="button"
                        className="ig-expand-toggle"
                        onClick={() => setExpandedDates((prev) => ({ ...prev, [date]: true }))}
                      >
                        全体を表示
                      </button>
                    </div>
                  )}

                  {expanded && hasBodyContent && (
                    <div className="ig-card-body-full">
                      {detail?.freeText && (
                        <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>{detail.freeText}</div>
                      )}
                      {groups.map((group) => (
                        <div key={group.subtitleId}>
                          <div className="ig-section-label">{group.subtitleLabel}</div>
                          <div className="stack-sm" style={{ paddingLeft: "14px" }}>
                            {group.items.map(({ def, checked }) => (
                              <div className="checkbox-row" key={def.id}>
                                <input type="checkbox" className="ig-checkbox" checked={checked ?? false} disabled readOnly />
                                <span style={{ fontSize: "0.8rem", fontWeight: 400 }}>{def.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {detail && detail.studyTimes.length > 0 && (
                        <div>
                          <div className="ig-section-label">学習時間</div>
                          <div style={{ paddingLeft: "14px" }}>
                            <div style={{ fontSize: "0.8rem" }}>
                              合計:{" "}
                              <strong>
                                {formatMinutes(detail.studyTimes.reduce((sum, st) => sum + st.minutes, 0))}
                              </strong>
                            </div>
                            <div className="stack-sm">
                              {detail.studyTimes.map((st) => (
                                <div key={st.subjectId} style={{ fontSize: "0.75rem" }}>
                                  <span className="muted">{st.subjectName}: </span>
                                  <span>{formatMinutes(st.minutes)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {isSubmitted && commentsOpen && (
                    <button
                      type="button"
                      className="ig-view-comments-link"
                      onClick={() => setOpenCommentsFor({ ...openCommentsFor, [date]: !commentsOpen })}
                    >
                      コメントを非表示にする
                    </button>
                  )}

                  {isSubmitted && commentsOpen && (
                    <div className="stack-sm">
                      {comments.length === 0 ? (
                        <div className="empty-state">コメントがまだありません</div>
                      ) : (
                        <div className="stack-sm">
                          {comments.map((comment) => (
                            <div key={comment.id} className="ig-comment-row-with-avatar">
                              <div className="ig-avatar-sm">
                                <Avatar
                                  src={comment.authorProfileImageUrl}
                                  name={comment.authorName}
                                  photoClassName="ig-avatar-sm-photo"
                                />
                              </div>
                              <div className="ig-comment-row-main">
                                <div className="ig-comment-text-line">
                                  <span className="ig-comment-author">{comment.authorName}</span>{" "}
                                  {comment.content}
                                </div>
                                <div className="ig-comment-meta">
                                  {new Date(comment.createdAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="ig-comment-form">
                        <div className="ig-avatar-sm">
                          <Avatar src={user?.profileImageUrl} name={user?.name} photoClassName="ig-avatar-sm-photo" />
                        </div>
                        <textarea
                          className="textarea"
                          placeholder="生徒はコメントできません（閲覧のみ）"
                          disabled
                          readOnly
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
