"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { teacherApi, ApiError, resolveFileUrl } from "@/lib/api";
import { Avatar } from "@/components/Avatar";
import { TeacherBlogActionsModal } from "@/components/TeacherBlogActionsModal";
import { useToast } from "@/components/Toast";
import { ChevronLeftIcon } from "@/components/icons";
import type { BlogImageResponse, BlogResponse, TeacherResponse } from "@/lib/types";

interface Params {
  teacherId: string;
}

export default function TeacherProfilePage({ params }: { params: Promise<Params> }) {
  const { teacherId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [teacher, setTeacher] = useState<TeacherResponse | null>(null);
  const [blogs, setBlogs] = useState<BlogResponse[]>([]);
  const [imagesByBlog, setImagesByBlog] = useState<Record<string, BlogImageResponse[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBlog, setSelectedBlog] = useState<BlogResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isOwn = Boolean(user && user.id === teacherId);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [teacherData, blogsData] = await Promise.all([
          teacherApi.getTeacher(teacherId),
          isOwn ? teacherApi.listOwnBlogs() : teacherApi.listPublishedBlogs(),
        ]);
        const visible = isOwn
          ? blogsData
          : blogsData.filter((blog) => blog.teacherId === teacherId);
        setTeacher(teacherData);
        setBlogs(visible);
        const imageEntries = await Promise.all(
          visible.map(async (blog) => [blog.id, await teacherApi.listBlogImages(blog.id)] as const)
        );
        setImagesByBlog(Object.fromEntries(imageEntries));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "講師プロフィールの読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [teacherId, isOwn]);

  if (loading) {
    return <div className="spinner-page">読み込み中...</div>;
  }

  const postCount = blogs.length;

  return (
    <div className="page ig-profile-page">
      <button
        type="button"
        className="ig-profile-back-button"
        onClick={() => router.push("/teacher/blogs")}
        aria-label="ブログ一覧へ戻る"
      >
        <ChevronLeftIcon />
        <span>ブログ一覧へ戻る</span>
      </button>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="ig-profile-top">
        <div className="ig-profile-avatar-lg">
          <Avatar
            src={teacher?.profileImageUrl}
            name={teacher?.name}
            photoClassName="ig-profile-avatar-lg-photo"
          />
        </div>
        <div className="ig-profile-stats">
          <div className="ig-profile-stat">
            <div className="ig-profile-stat-num">{postCount}</div>
            <div className="ig-profile-stat-label">投稿</div>
          </div>
          <div className="ig-profile-stat">
            <div className="ig-profile-stat-num">???</div>
            <div className="ig-profile-stat-label">フォロワー</div>
          </div>
          <div className="ig-profile-stat">
            <div className="ig-profile-stat-num">???</div>
            <div className="ig-profile-stat-label">フォロー中</div>
          </div>
        </div>
      </div>

      <div className="ig-profile-bio">
        <div className="ig-profile-name">{teacher?.name ?? "講師"}</div>
        <div className="ig-profile-handle-row">
          <span className="ig-profile-handle">@{teacher?.username ?? teacherId}</span>
          <span className="badge badge-muted">講師</span>
        </div>
        {isOwn && (
          <Link href="/teacher/blogs/new" className="ig-goal-new-link">
            新規投稿
          </Link>
        )}
      </div>

      {blogs.length === 0 ? (
        <div className="empty-state">
          {isOwn ? "まだブログがありません" : "ブログがまだありません"}
        </div>
      ) : (
        <div className="ig-profile-grid">
          {blogs.map((blog) => {
            const cover = imagesByBlog[blog.id]?.[0];
            const imageSrc = cover
              ? resolveFileUrl(cover.imageUrl)
              : `https://picsum.photos/seed/blog-${blog.id}/400/400`;
            const inner = (
              <>
                <img src={imageSrc} alt="" />
                <span className="ig-profile-grid-item-caption">{blog.title}</span>
              </>
            );
            return isOwn ? (
              <button
                key={blog.id}
                type="button"
                className="ig-profile-grid-item ig-profile-grid-item-captioned"
                aria-label={blog.title}
                onClick={() => setSelectedBlog(blog)}
              >
                {inner}
              </button>
            ) : (
              <div key={blog.id} className="ig-profile-grid-item ig-profile-grid-item-captioned">
                {inner}
              </div>
            );
          })}
        </div>
      )}

      {selectedBlog && (
        <TeacherBlogActionsModal
          title={selectedBlog.title}
          submitting={deleting}
          onEdit={() => router.push(`/teacher/blogs/${selectedBlog.id}/edit`)}
          onDelete={async () => {
            if (!window.confirm("このブログを削除してよろしいですか？") || deleting) return;
            setDeleting(true);
            try {
              await teacherApi.deleteBlog(selectedBlog.id);
              setBlogs((prev) => prev.filter((blog) => blog.id !== selectedBlog.id));
              setSelectedBlog(null);
            } catch (err) {
              showToast(err instanceof ApiError ? err.message : "削除に失敗しました", "error");
            } finally {
              setDeleting(false);
            }
          }}
          onClose={() => {
            if (!deleting) setSelectedBlog(null);
          }}
        />
      )}
    </div>
  );
}
