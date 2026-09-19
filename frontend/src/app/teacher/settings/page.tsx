"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { Avatar } from "@/components/Avatar";
import { PlusIcon } from "@/components/icons";
import { TeacherBlogActionsModal } from "@/components/TeacherBlogActionsModal";
import { teacherApi, ApiError, resolveFileUrl } from "@/lib/api";
import type { BlogImageResponse, BlogResponse } from "@/lib/types";
import { ProfileImageModal } from "./ProfileImageModal";

const HIGHLIGHTS = [
  { key: "study", seed: "profile-highlight-study", label: "勉強" },
  { key: "goal", seed: "profile-highlight-goal", label: "目標" },
  { key: "report", seed: "profile-highlight-report", label: "レポート" },
  { key: "memory", seed: "profile-highlight-memory", label: "思い出" },
  { key: "effort", seed: "profile-highlight-effort", label: "頑張り" },
  { key: "daily", seed: "profile-highlight-daily", label: "日常" },
];

export default function TeacherSettingsPage() {
  const router = useRouter();
  const { user, updateProfileImageUrl } = useAuth();
  const { showToast } = useToast();
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<BlogResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [blogs, setBlogs] = useState<BlogResponse[]>([]);
  const [imagesByBlog, setImagesByBlog] = useState<Record<string, BlogImageResponse[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const own = await teacherApi.listOwnBlogs();
        setBlogs(own);
        const imageEntries = await Promise.all(
          own.map(async (blog) => [blog.id, await teacherApi.listBlogImages(blog.id)] as const)
        );
        setImagesByBlog(Object.fromEntries(imageEntries));
      } catch (err) {
        if (!(err instanceof ApiError)) {
          setBlogs([]);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="page ig-profile-page">
      <div className="ig-profile-top">
        <div className="ig-profile-avatar-lg-wrap">
          <div className="ig-profile-avatar-lg">
            <Avatar
              src={user?.profileImageUrl}
              name={user?.name}
              photoClassName="ig-profile-avatar-lg-photo"
            />
          </div>
          <button
            type="button"
            className="ig-profile-avatar-edit-btn"
            onClick={() => setImageModalOpen(true)}
            aria-label="プロフィール画像を変更"
          >
            <PlusIcon />
          </button>
        </div>
        <div className="ig-profile-stats">
          <div className="ig-profile-stat">
            <div className="ig-profile-stat-num">{loading ? "—" : blogs.length}</div>
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
        <div className="ig-profile-name">{user?.name}</div>
        <div className="ig-profile-handle-row">
          <span className="ig-profile-handle">@{user?.username}</span>
          <span className="badge badge-muted">講師</span>
        </div>
        <div className="ig-profile-note">
          アカウント情報の変更・パスワードの再設定は管理者にお問い合わせください。
        </div>
      </div>

      <div className="ig-story-scroll">
        {HIGHLIGHTS.map((h) => (
          <div key={h.key} className="ig-story-scroll-item">
            <div className="ig-story-avatar-ring">
              <div className="ig-story-avatar">
                <img
                  src={`https://picsum.photos/seed/${h.seed}/100/100`}
                  alt=""
                  className="ig-story-avatar-photo"
                />
              </div>
            </div>
            <div className="ig-story-scroll-item-label">{h.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="empty-state">読み込み中...</div>
      ) : blogs.length === 0 ? (
        <div className="empty-state">まだブログがありません</div>
      ) : (
        <div className="ig-profile-grid">
          {blogs.map((blog) => {
            const cover = imagesByBlog[blog.id]?.[0];
            const imageSrc = cover
              ? resolveFileUrl(cover.imageUrl)
              : `https://picsum.photos/seed/blog-${blog.id}/400/400`;
            return (
              <button
                key={blog.id}
                type="button"
                className="ig-profile-grid-item ig-profile-grid-item-captioned"
                aria-label={blog.title}
                onClick={() => setSelectedBlog(blog)}
              >
                <img src={imageSrc} alt="" />
                <span className="ig-profile-grid-item-caption">{blog.title}</span>
              </button>
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

      {imageModalOpen && (
        <ProfileImageModal
          currentImageUrl={user?.profileImageUrl ?? null}
          name={user?.name}
          onClose={() => setImageModalOpen(false)}
          onUpdated={updateProfileImageUrl}
        />
      )}
    </div>
  );
}
