"use client";

import { useEffect, useState } from "react";
import { studentApi, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { ImageCarousel } from "@/components/ImageCarousel";
import { Avatar } from "@/components/Avatar";
import { HeartIcon, ChatIcon } from "@/components/icons";
import type {
  BlogCommentResponse,
  BlogImageResponse,
  BlogResponse,
  ReportLikeStatusResponse,
  TeacherResponse,
} from "@/lib/types";

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
}

export default function StudentBlogsList() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [blogs, setBlogs] = useState<BlogResponse[]>([]);
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
  const [imagesByBlog, setImagesByBlog] = useState<Record<string, BlogImageResponse[]>>({});
  const [commentsByBlog, setCommentsByBlog] = useState<Record<string, BlogCommentResponse[]>>({});
  const [likeStatusByBlog, setLikeStatusByBlog] = useState<Record<string, ReportLikeStatusResponse>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openCommentsFor, setOpenCommentsFor] = useState<Record<string, boolean>>({});
  const [likingFor, setLikingFor] = useState<Record<string, boolean>>({});
  const [expandedBlogs, setExpandedBlogs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      try {
        const data = await studentApi.listPublishedBlogs();
        setBlogs(data);

        const entries = await Promise.all(
          data.map(async (blog) => {
            const [images, comments, likeStatus] = await Promise.all([
              studentApi.listBlogImages(blog.id),
              studentApi.listBlogComments(blog.id),
              studentApi.getBlogLikeStatus(blog.id),
            ]);
            return { id: blog.id, images, comments, likeStatus };
          })
        );

        setImagesByBlog(Object.fromEntries(entries.map((e) => [e.id, e.images])));
        setCommentsByBlog(Object.fromEntries(entries.map((e) => [e.id, e.comments])));
        setLikeStatusByBlog(Object.fromEntries(entries.map((e) => [e.id, e.likeStatus])));
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("ブログ一覧の読み込みに失敗しました");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await studentApi.listTeachers();
        setTeachers(data);
      } catch {
        setTeachers([]);
      }
    })();
  }, []);

  const handleToggleLike = async (blogId: string) => {
    const status = likeStatusByBlog[blogId] ?? { liked: false, count: 0 };
    setLikingFor({ ...likingFor, [blogId]: true });
    try {
      if (status.liked) {
        await studentApi.unlikeBlog(blogId);
        setLikeStatusByBlog({
          ...likeStatusByBlog,
          [blogId]: { liked: false, count: status.count - 1 },
        });
      } else {
        await studentApi.likeBlog(blogId);
        setLikeStatusByBlog({
          ...likeStatusByBlog,
          [blogId]: { liked: true, count: status.count + 1 },
        });
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "いいね操作に失敗しました";
      showToast(msg, "error");
    } finally {
      setLikingFor({ ...likingFor, [blogId]: false });
    }
  };

  if (loading) {
    return <div className="page"><div className="spinner-page">読み込み中...</div></div>;
  }

  if (error && blogs.length === 0) {
    return (
      <div className="page">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="page">
      {teachers.length > 0 && (
        <div className="ig-story-section">
          <div className="ig-story-row">
            <div className="ig-story-scroll">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="ig-story-scroll-item">
                  <div className="ig-story-avatar-ring">
                    <div className="ig-story-avatar">
                      <Avatar
                        src={teacher.profileImageUrl}
                        name={teacher.name}
                        textClassName="ig-story-avatar-inner"
                        photoClassName="ig-story-avatar-photo"
                      />
                    </div>
                  </div>
                  <div className="ig-story-scroll-item-label">{teacher.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="stack">
        {blogs.length === 0 ? (
          <div className="empty-state">ブログがまだ投稿されていません</div>
        ) : (
          blogs.map((blog) => {
            const images = imagesByBlog[blog.id] ?? [];
            const comments = commentsByBlog[blog.id] ?? [];
            const likeStatus = likeStatusByBlog[blog.id] ?? { liked: false, count: 0 };
            const commentsOpen = Boolean(openCommentsFor[blog.id]);
            const expanded = Boolean(expandedBlogs[blog.id]);

            return (
              <div key={blog.id} className="ig-card">
                <div className="ig-card-header">
                  <div className="ig-avatar">
                    <Avatar
                      src={blog.teacherProfileImageUrl}
                      name={blog.teacherName}
                      photoClassName="ig-avatar-photo"
                    />
                  </div>
                  <div className="ig-card-header-main">
                    <div className="ig-card-header-title">{blog.title}</div>
                    <div className="ig-card-header-sub">
                      <span className="muted" style={{ fontSize: "0.85rem" }}>
                        {blog.teacherName} - {formatDateTime(blog.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <ImageCarousel
                  images={images}
                  altText="ブログ画像"
                  fallbackSeed={`blog-${blog.id}`}
                />

                <div className="ig-card-body" style={{ paddingTop: "12px" }}>
                  <div className="ig-action-bar">
                    <button
                      className={`ig-icon-btn ${likeStatus.liked ? "liked" : ""}`}
                      onClick={() => handleToggleLike(blog.id)}
                      disabled={likingFor[blog.id]}
                      type="button"
                    >
                      <HeartIcon filled={likeStatus.liked} />
                      {likeStatus.count > 0 && <span>{likeStatus.count}</span>}
                    </button>
                    <button
                      className="ig-icon-btn"
                      type="button"
                      onClick={() => setOpenCommentsFor({ ...openCommentsFor, [blog.id]: !commentsOpen })}
                    >
                      <ChatIcon />
                      {comments.length > 0 && <span>{comments.length}</span>}
                    </button>
                  </div>

                  {!expanded && (
                    <div className="ig-body-line-row">
                      <div className="ig-body-oneline">{blog.content}</div>
                      <button
                        type="button"
                        className="ig-expand-toggle"
                        onClick={() => setExpandedBlogs((prev) => ({ ...prev, [blog.id]: true }))}
                      >
                        全体を表示
                      </button>
                    </div>
                  )}

                  {expanded && (
                    <div className="ig-card-body-full">
                      <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>{blog.content}</div>
                    </div>
                  )}

                  {commentsOpen && (
                    <button
                      type="button"
                      className="ig-view-comments-link"
                      onClick={() => setOpenCommentsFor({ ...openCommentsFor, [blog.id]: !commentsOpen })}
                    >
                      コメントを非表示にする
                    </button>
                  )}

                  {commentsOpen && (
                    <div className="stack-sm">
                      {comments.length === 0 ? (
                        <div className="empty-state">コメントがまだありません</div>
                      ) : (
                        <div className="stack-sm">
                          {comments
                            .filter((c) => !c.parentCommentId)
                            .map((comment) => (
                              <div key={comment.id}>
                                <div className="ig-comment-row-with-avatar">
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
                                    <div className="ig-comment-meta">{formatDateTime(comment.createdAt)}</div>
                                  </div>
                                </div>

                                {comments.filter((c) => c.parentCommentId === comment.id).length > 0 && (
                                  <div className="comment-thread">
                                    {comments
                                      .filter((c) => c.parentCommentId === comment.id)
                                      .map((reply) => (
                                        <div key={reply.id} className="ig-comment-row-with-avatar">
                                          <div className="ig-avatar-sm">
                                            <Avatar
                                              src={reply.authorProfileImageUrl}
                                              name={reply.authorName}
                                              photoClassName="ig-avatar-sm-photo"
                                            />
                                          </div>
                                          <div className="ig-comment-row-main">
                                            <div className="ig-comment-text-line">
                                              <span className="ig-comment-author">{reply.authorName}</span>{" "}
                                              {reply.content}
                                            </div>
                                            <div className="ig-comment-meta">{formatDateTime(reply.createdAt)}</div>
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                )}
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
