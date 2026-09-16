"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type InitialValues = {
  id?: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  coverPhotoUrl: string;
  readMinutes: number;
  status: "DRAFT" | "PUBLISHED";
};

export default function ArticleForm({ initial }: { initial?: InitialValues }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(initial?.coverPhotoUrl ?? "");
  const [readMinutes, setReadMinutes] = useState(initial?.readMinutes ?? 5);
  const [status, setStatus] = useState(initial?.status ?? "DRAFT");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      title,
      slug,
      category,
      excerpt,
      content,
      coverPhotoUrl: coverPhotoUrl || undefined,
      readMinutes,
      status,
    };

    const res = await fetch(isEdit ? `/api/admin/articles/${initial!.id}` : "/api/admin/articles", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setIsSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error?.formErrors?.[0] ?? data.error ?? "Something went wrong");
      return;
    }

    router.push("/admin/travel-guide");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className="input" />
        </Field>
        <Field label="Slug (URL, lowercase-with-hyphens)">
          <input value={slug} onChange={(e) => setSlug(e.target.value)} required className="input" />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Category">
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Visa & Entry, SDF Fee, Festivals & Seasons..."
            required
            className="input"
          />
        </Field>
        <Field label="Read time (minutes)">
          <input
            type="number"
            min={1}
            value={readMinutes}
            onChange={(e) => setReadMinutes(Number(e.target.value))}
            required
            className="input"
          />
        </Field>
      </div>

      <Field label="Excerpt (shown on cards, max 300 chars)">
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          maxLength={300}
          required
          className="input"
        />
      </Field>

      <Field label="Cover photo URL (optional)">
        <input value={coverPhotoUrl} onChange={(e) => setCoverPhotoUrl(e.target.value)} className="input" />
      </Field>

      <Field label="Content">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          required
          className="input font-mono text-sm"
        />
      </Field>

      <Field label="Status">
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="input">
          <option value="DRAFT">Draft (hidden from travelers)</option>
          <option value="PUBLISHED">Published</option>
        </select>
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Create article"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
