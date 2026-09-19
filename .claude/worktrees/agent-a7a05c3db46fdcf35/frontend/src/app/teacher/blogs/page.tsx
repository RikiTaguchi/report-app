"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { teacherApi, ApiError } from "@/lib/api";
import { BlogFeedCard } from "@/components/BlogFeedCard";
import type { BlogImageResponse, BlogResponse } from "@/lib/types";

function BlogsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filterTeacherId = searchParams.get("teacherId");

  const [ownBlogs, setOwnBlogs] = useState<BlogResponse[]>([]);
  const [publishedBlogs, setPublishedBlogs] = useState<BlogResponse[]>([]);
  const [imagesByBlog, setImagesByBlog] = useState<Record<string, BlogImageResponse[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"own" | "published">("own");

  useEffect(() => {
    async function load() {
      try {
        const [own, published] = await Promise.all([
          teacherApi.listOwnBlogs(),
          teacherApi.listPublishedBlogs(),
        ]);
        setOwnBlogs(own);
        setPublishedBlogs(published);

        const all = [...own, ...published];
        const imagesEntries = await Promise.all(
          all.map(async (blog) => [blog.id, await teacherApi.listBlogImages(blog.id)] as const)
        );
        setImagesByBlog(Object.fromEntries(imagesEntries));
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

  const visibleBlogs =
    tab === "own"
      ? ownBlogs
      : filterTeacherId
        ? publishedBlogs.filter((b) => b.teacherId === filterTeacherId)
        : publishedBlogs;

  return (
    <div className="page">
      <div className="page-header">
        <h1>ブログ</h1>
        <Link href="/teacher/blogs/new" className="btn btn-primary">
          新規作成
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="role-tabs">
        <button
          className={`role-tab ${tab === "own" ? "active" : ""}`}
          onClick={() => setTab("own")}
        >
          自分のブログ
        </button>
        <button
          className={`role-tab ${tab === "published" ? "active" : ""}`}
          onClick={() => setTab("published")}
        >
          公開ブログ一覧
        </button>
      </div>

      {tab === "published" && filterTeacherId && (
        <div className="alert" style={{ marginBottom: "12px" }}>
          この講師の投稿のみ表示中
          <button
            className="btn btn-sm btn-ghost"
            style={{ marginLeft: 10 }}
            onClick={() => router.replace(pathname)}
          >
            フィルタ解除
          </button>
        </div>
      )}

      {visibleBlogs.length === 0 ? (
        <div className="empty-state">ブログがありません</div>
      ) : (
        <div className="stack">
          {visibleBlogs.map((blog) => (
            <BlogFeedCard
              key={blog.id}
              blog={blog}
              images={imagesByBlog[blog.id] ?? []}
              href={`/teacher/blogs/${blog.id}`}
              authorLabel={
                tab === "published"
                  ? blog.teacherName || blog.teacherId
                  : blog.publishedAt
                    ? new Date(blog.publishedAt).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })
                    : "下書き"
              }
              authorHref={tab === "published" ? `/teacher/blogs?teacherId=${blog.teacherId}` : undefined}
              statusBadge={
                tab === "own" &&
                (blog.publishedAt ? (
                  <span className="badge badge-success">公開</span>
                ) : (
                  <span className="badge badge-muted">下書き</span>
                ))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function BlogsPage() {
  return (
    <Suspense fallback={<div className="spinner-page">読み込み中...</div>}>
      <BlogsPageContent />
    </Suspense>
  );
}
