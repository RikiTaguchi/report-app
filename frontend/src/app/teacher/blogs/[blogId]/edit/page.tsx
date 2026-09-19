"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BLOG_MAX_IMAGES, TeacherBlogForm } from "@/components/TeacherBlogForm";
import { teacherApi, ApiError, resolveFileUrl } from "@/lib/api";
import type { BlogImageResponse, BlogResponse } from "@/lib/types";

interface Params {
  blogId: string;
}

export default function EditBlogPage({ params }: { params: Promise<Params> }) {
  const { blogId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [blog, setBlog] = useState<BlogResponse | null>(null);
  const [images, setImages] = useState<BlogImageResponse[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [blogData, imagesData] = await Promise.all([
          teacherApi.getBlog(blogId),
          teacherApi.listBlogImages(blogId),
        ]);
        setBlog(blogData);
        setTitle(blogData.title);
        setContent(blogData.content);
        setImages(imagesData);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "ブログの読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [blogId]);

  async function handleSave() {
    if (!title.trim() || !content.trim()) return;

    try {
      setSubmitting(true);
      const updated = await teacherApi.updateBlog(blogId, { title, content });
      setBlog(updated);
      router.push("/teacher/blogs");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ブログの保存に失敗しました");
      setSubmitting(false);
    }
  }

  async function handleUploadImages(files: FileList | null) {
    if (!files) return;
    const selected = Array.from(files);
    if (images.length + selected.length > BLOG_MAX_IMAGES) {
      setError(`画像は最大${BLOG_MAX_IMAGES}枚までです`);
      return;
    }
    try {
      setError(null);
      const uploaded: BlogImageResponse[] = [];
      for (const file of selected) {
        uploaded.push(await teacherApi.uploadBlogImage(blogId, file));
      }
      setImages((current) => [...current, ...uploaded]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "画像アップロードに失敗しました");
    }
  }

  async function handleDeleteImage(imageId: string) {
    if (!confirm("画像を削除してよろしいですか？")) return;
    try {
      await teacherApi.deleteBlogImage(blogId, imageId);
      setImages((current) => current.filter((img) => img.id !== imageId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "削除に失敗しました");
    }
  }

  if (loading) {
    return <div className="spinner-page">読み込み中...</div>;
  }

  if (!blog) {
    return (
      <div className="page">
        <div className="empty-state">ブログが見つかりません</div>
      </div>
    );
  }

  if (blog.teacherId !== user?.id) {
    return (
      <div className="page">
        <div className="alert alert-error">このブログを編集する権限がありません</div>
      </div>
    );
  }

  return (
    <TeacherBlogForm
      title={title}
      content={content}
      images={images.map((image) => ({ key: image.id, url: resolveFileUrl(image.imageUrl) }))}
      error={error}
      submitting={submitting}
      submitLabel="保存"
      onTitleChange={setTitle}
      onContentChange={setContent}
      onSelectImages={(files) => void handleUploadImages(files)}
      onRemoveImage={(key) => void handleDeleteImage(key)}
      onSubmit={() => void handleSave()}
      onBack={() => router.push("/teacher/blogs")}
    />
  );
}
