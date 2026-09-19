"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { TeacherBlogCard, type TeacherBlogFeedItem } from "@/components/TeacherBlogCard";
import { teacherApi, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { BlogResponse, TeacherResponse } from "@/lib/types";

function compareNewest(a: BlogResponse, b: BlogResponse): number {
  return b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id);
}

export default function BlogsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<TeacherBlogFeedItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [published, teacherList] = await Promise.all([
          teacherApi.listPublishedBlogs(),
          teacherApi.listTeachers(),
        ]);
        const sorted = [...published].sort(compareNewest);
        const teacherById = new Map(teacherList.map((teacher) => [teacher.id, teacher]));
        const feedItems = await Promise.all(
          sorted.map(async (blog) => {
            try {
              const [images, comments, likeStatus] = await Promise.all([
                teacherApi.listBlogImages(blog.id),
                teacherApi.listBlogComments(blog.id),
                teacherApi.getBlogLikeStatus(blog.id),
              ]);
              return {
                blog,
                images,
                comments,
                likeStatus,
                authorProfileImageUrl: teacherById.get(blog.teacherId)?.profileImageUrl ?? null,
              };
            } catch {
              return {
                blog,
                images: [],
                comments: [],
                likeStatus: { liked: false, count: 0 },
                authorProfileImageUrl: teacherById.get(blog.teacherId)?.profileImageUrl ?? null,
              };
            }
          })
        );
        setItems(feedItems);
        setTeachers(teacherList);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("ブログの読み込みに失敗しました");
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return <div className="spinner-page">読み込み中...</div>;
  }

  const storyTeachers = [
    ...teachers.filter((teacher) => teacher.id === user?.id),
    ...teachers.filter((teacher) => teacher.id !== user?.id),
  ];

  return (
    <div className="page">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="ig-story-section">
        <div className="ig-story-row">
          <div className="ig-story-scroll">
            {storyTeachers.map((teacher) => {
              const isOwn = teacher.id === user?.id;
              return (
                <Link
                  key={teacher.id}
                  href={isOwn ? "/teacher/settings" : `/teacher/teachers/${teacher.id}`}
                  className="ig-story-scroll-item"
                  aria-label={isOwn ? "設定を開く" : `${teacher.name || "講師"}のプロフィール`}
                >
                  <div className="ig-story-avatar-ring">
                    <div className="ig-story-avatar">
                      <Avatar
                        src={teacher.profileImageUrl}
                        name={teacher.name}
                        photoClassName="ig-story-avatar-photo"
                        textClassName="ig-story-avatar-inner"
                      />
                    </div>
                  </div>
                  <div className="ig-story-scroll-item-label">{teacher.name || "講師"}</div>
                </Link>
              );
            })}
          </div>
          <div className="ig-story-row-controls-vertical">
            <Link href="/teacher/blogs/new" className="btn btn-primary btn-sm">
              新規作成
            </Link>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">ブログがまだ投稿されていません</div>
      ) : (
        <div className="stack">
          {items.map((item) => (
            <TeacherBlogCard
              key={item.blog.id}
              item={item}
              onDeleted={(blogId) => setItems((prev) => prev.filter((feedItem) => feedItem.blog.id !== blogId))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
