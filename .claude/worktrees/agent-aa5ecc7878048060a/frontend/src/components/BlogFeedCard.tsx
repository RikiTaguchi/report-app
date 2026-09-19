"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { resolveFileUrl } from "@/lib/api";
import type { BlogImageResponse, BlogResponse } from "@/lib/types";

interface BlogFeedCardProps {
  blog: BlogResponse;
  images: BlogImageResponse[];
  href: string;
  authorLabel?: string;
  authorHref?: string;
  statusBadge?: React.ReactNode;
}

function truncate(text: string, length: number): string {
  return text.length > length ? text.substring(0, length) + "..." : text;
}

export function BlogFeedCard({ blog, images, href, authorLabel, authorHref, statusBadge }: BlogFeedCardProps) {
  const router = useRouter();

  return (
    <div
      className="card card-link feed-card"
      role="link"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(href);
      }}
    >
      <div className="stack-sm">
        <div className="row-between">
          <div className="section-title">{blog.title}</div>
          {statusBadge}
        </div>
        {authorLabel && (
          <div className="muted" style={{ fontSize: "0.8rem" }}>
            {authorHref ? (
              <Link href={authorHref} onClick={(e) => e.stopPropagation()}>
                {authorLabel}
              </Link>
            ) : (
              authorLabel
            )}
          </div>
        )}

        {images.length > 0 && (
          <div className="image-grid">
            {images.slice(0, 3).map((img) => (
              <div key={img.id} className="image-tile">
                <img src={resolveFileUrl(img.imageUrl)} alt="Blog" />
              </div>
            ))}
          </div>
        )}

        <div className="feed-stats">
          <span>{blog.likedByMe ? "♥" : "♡"} {blog.likeCount}</span>
          <span>💬 {blog.commentCount}</span>
        </div>

        <div style={{ fontSize: "0.9rem" }}>{truncate(blog.content, 100)}</div>
      </div>
    </div>
  );
}
