"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BLOG_MAX_IMAGES, TeacherBlogForm } from "@/components/TeacherBlogForm";
import { teacherApi, ApiError } from "@/lib/api";

export default function NewBlogPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const nextPreviews = images.map((file) => URL.createObjectURL(file));
    setPreviews(nextPreviews);
    return () => nextPreviews.forEach((url) => URL.revokeObjectURL(url));
  }, [images]);

  function handleSelectImages(files: FileList | null) {
    if (!files) return;
    const selected = Array.from(files);
    if (images.length + selected.length > BLOG_MAX_IMAGES) {
      setError(`画像は最大${BLOG_MAX_IMAGES}枚までです`);
      return;
    }
    setError(null);
    setImages((current) => [...current, ...selected]);
  }

  async function handleCreate() {
    if (!title.trim() || !content.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      const blog = await teacherApi.createBlog({ title: title.trim(), content: content.trim() });
      for (const file of images) await teacherApi.uploadBlogImage(blog.id, file);
      router.push("/teacher/blogs");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ブログの作成に失敗しました");
      setSubmitting(false);
    }
  }

  return (
    <TeacherBlogForm
      title={title}
      content={content}
      images={previews.map((url, index) => ({ key: `${url}-${index}`, url }))}
      error={error}
      submitting={submitting}
      submitLabel="投稿する"
      onTitleChange={setTitle}
      onContentChange={setContent}
      onSelectImages={handleSelectImages}
      onRemoveImage={(key) => {
        const index = previews.findIndex((url, i) => `${url}-${i}` === key);
        if (index >= 0) setImages((current) => current.filter((_, i) => i !== index));
      }}
      onSubmit={() => void handleCreate()}
      onBack={() => router.push("/teacher/blogs")}
    />
  );
}
