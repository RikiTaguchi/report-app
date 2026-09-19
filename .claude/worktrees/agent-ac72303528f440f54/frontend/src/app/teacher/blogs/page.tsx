"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { ImageCarousel } from "@/components/ImageCarousel";
import { ChatIcon, HeartIcon } from "@/components/icons";
import { teacherApi, ApiError } from "@/lib/api";
import type { BlogImageResponse, BlogResponse } from "@/lib/types";

function TeacherBlogFeedCard({
  blog,
  images,
  isOwnView,
}: {
  blog: BlogResponse;
  images: BlogImageResponse[];
  isOwnView: boolean;
}) {
  const authorName = blog.teacherName || blog.teacherId;
  const authorHref = `/teacher/blogs?teacherId=${encodeURIComponent(blog.teacherId)}`;
  const publishedLabel = blog.publishedAt
    ? new Date(blog.publishedAt).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })
    : "下書き";

  return (
    <article className="ig-card">
      <Link href={`/teacher/blogs/${blog.id}`} className="ig-card-header">
        <div className="ig-avatar">
          <Avatar name={authorName} photoClassName="ig-avatar-photo" />
        </div>
        <div className="ig-card-header-main">
          <div className="ig-card-header-title">{authorName}</div>
          <div className="ig-card-header-sub">{publishedLabel}</div>
        </div>
        {isOwnView &&
          (blog.publishedAt ? (
            <span className="badge badge-success">公開</span>
          ) : (
            <span className="badge badge-muted">下書き</span>
          ))}
      </Link>

      <ImageCarousel images={images} altText="ブログ画像" fallbackSeed={`blog-${blog.id}`} />

      <div className="ig-card-body">
        <div className="ig-action-bar">
          <Link href={`/teacher/blogs/${blog.id}`} className="ig-icon-btn" aria-label="ブログ詳細を表示">
            <HeartIcon filled={blog.likedByMe} />
            {blog.likeCount > 0 && <span>{blog.likeCount}</span>}
          </Link>
          <Link href={`/teacher/blogs/${blog.id}`} className="ig-icon-btn" aria-label="コメントを表示">
            <ChatIcon />
            {blog.commentCount > 0 && <span>{blog.commentCount}</span>}
          </Link>
        </div>

        <Link href={`/teacher/blogs/${blog.id}`} className="ig-section-label">
          {blog.title}
        </Link>
        <div style={{ fontSize: "0.9rem", whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
          {blog.content.length > 140 ? `${blog.content.slice(0, 140)}...` : blog.content}
        </div>
        {!isOwnView && (
          <Link href={authorHref} className="muted" style={{ fontSize: "0.8rem" }}>
            {authorName} のブログを見る
          </Link>
        )}
      </div>
    </article>
  );
}

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
  const [tab, setTab] = useState<"own" | "published">("published");

  useEffect(() => {
    async function load() {
      try {
        const [own, published] = await Promise.all([
          teacherApi.listOwnBlogs(),
          teacherApi.listPublishedBlogs(),
        ]);
        setOwnBlogs(own);
        setPublishedBlogs(published);

        const uniqueBlogs = Array.from(new Map([...own, ...published].map((blog) => [blog.id, blog])).values());
        const imagesEntries = await Promise.all(
          uniqueBlogs.map(async (blog) => [blog.id, await teacherApi.listBlogImages(blog.id)] as const)
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

  const storyAuthors = useMemo(() => {
    const authors = new Map<string, { id: string; name: string | null }>();
    publishedBlogs.forEach((blog) => {
      if (!authors.has(blog.teacherId)) {
        authors.set(blog.teacherId, { id: blog.teacherId, name: blog.teacherName });
      }
    });
    return Array.from(authors.values());
  }, [publishedBlogs]);

  if (loading) {
    return <div className="spinner-page">読み込み中...</div>;
  }

  const visibleBlogs =
    tab === "own"
      ? ownBlogs
      : filterTeacherId
        ? publishedBlogs.filter((blog) => blog.teacherId === filterTeacherId)
        : publishedBlogs;

  function showPublished() {
    setTab("published");
  }

  function showOwnBlogs() {
    setTab("own");
    if (filterTeacherId) router.replace(pathname);
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>ブログ</h1>
        <Link href="/teacher/blogs/new" className="btn btn-primary">
          新規作成
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {storyAuthors.length > 0 && (
        <div className="ig-story-section">
          <div className="ig-story-row">
            <div className="ig-story-scroll">
              {storyAuthors.map((author) => (
                <Link
                  key={author.id}
                  href={`/teacher/blogs?teacherId=${encodeURIComponent(author.id)}`}
                  className="ig-story-scroll-item"
                  aria-label={`${author.name || "講師"}のブログを表示`}
                  onClick={() => setTab("published")}
                >
                  <div className="ig-story-avatar-ring">
                    <div className="ig-story-avatar">
                      <Avatar
                        name={author.name}
                        photoClassName="ig-story-avatar-photo"
                        textClassName="ig-story-avatar-inner"
                      />
                    </div>
                  </div>
                  <div className="ig-story-scroll-item-label">{author.name || "講師"}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="role-tabs" aria-label="ブログ表示切り替え">
        <button
          className={`role-tab ${tab === "published" ? "active" : ""}`}
          onClick={showPublished}
          type="button"
        >
          公開ブログ一覧
        </button>
        <button
          className={`role-tab ${tab === "own" ? "active" : ""}`}
          onClick={showOwnBlogs}
          type="button"
        >
          自分のブログ・下書き
        </button>
      </div>

      {tab === "published" && filterTeacherId && (
        <div className="alert" style={{ marginBottom: "12px" }}>
          この講師の投稿のみ表示中
          <button
            className="btn btn-sm btn-ghost"
            style={{ marginLeft: 10 }}
            onClick={() => router.replace(pathname)}
            type="button"
          >
            フィルタ解除
          </button>
        </div>
      )}

      {visibleBlogs.length === 0 ? (
        <div className="empty-state">
          {tab === "own" ? "自分のブログがありません" : "公開ブログがまだ投稿されていません"}
        </div>
      ) : (
        <div className="stack">
          {visibleBlogs.map((blog) => (
            <TeacherBlogFeedCard
              key={blog.id}
              blog={blog}
              images={imagesByBlog[blog.id] ?? []}
              isOwnView={tab === "own"}
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
