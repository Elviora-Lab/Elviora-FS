'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Product image manager: upload files (via the presign → object-storage flow)
 * or paste image URLs directly. The first image is the primary. Falls back to
 * URL paste when object storage isn't configured.
 */
export function ImageUploader({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [url, setUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function addUrl() {
    const u = url.trim();
    if (!u) return;
    try {
      new URL(u);
    } catch {
      toast.error('Enter a valid URL');
      return;
    }
    if (value.includes(u)) {
      toast.info('That image is already added');
      setUrl('');
      return;
    }
    onChange([...value, u]);
    setUrl('');
  }

  function remove(u: string) {
    onChange(value.filter((x) => x !== u));
  }

  function makePrimary(u: string) {
    onChange([u, ...value.filter((x) => x !== u)]);
  }

  async function uploadOne(file: File): Promise<string> {
    // 1) Upload the RAW file straight to storage via a presigned URL. Going
    //    direct (client → storage) sidesteps Vercel's 4.5MB function body limit,
    //    so large phone photos upload fine.
    const res = await fetch('/api/v1/uploads/presign', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        kind: 'productImage',
        contentType: file.type,
        filename: file.name,
        sizeBytes: file.size,
      }),
    });
    const json = (await res.json().catch(() => null)) as {
      success: boolean;
      message?: string;
      data?: { key: string; uploadUrl: string; publicUrl: string };
    } | null;
    if (!res.ok || !json?.success || !json.data) {
      throw new Error(json?.message ?? 'Upload is not available');
    }
    const put = await fetch(json.data.uploadUrl, {
      method: 'PUT',
      headers: { 'content-type': file.type },
      body: file,
    });
    if (!put.ok) throw new Error('Upload failed');

    // 2) Optimize server-side (sharp → WebP). If it fails for any reason, fall
    //    back to the raw upload so the image still saves.
    try {
      const opt = await fetch('/api/v1/uploads/optimize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind: 'productImage', key: json.data.key }),
      });
      const oj = (await opt.json().catch(() => null)) as {
        success: boolean;
        data?: { publicUrl: string };
      } | null;
      if (opt.ok && oj?.success && oj.data?.publicUrl) return oj.data.publicUrl;
    } catch {
      /* fall through to the raw URL */
    }
    return json.data.publicUrl;
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        try {
          uploaded.push(await uploadOne(file));
        } catch (e) {
          toast.error(`${file.name}: ${(e as Error).message}`);
        }
      }
      if (uploaded.length) {
        onChange([...value, ...uploaded]);
        toast.success(`Uploaded ${uploaded.length} image${uploaded.length > 1 ? 's' : ''}`);
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {value.map((u, i) => (
            <div
              key={u}
              className="group relative h-24 w-24 overflow-hidden rounded-md border border-border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="h-full w-full object-cover" />
              {i === 0 ? (
                <span className="absolute left-1 top-1 rounded bg-foreground/80 px-1 text-[10px] text-background">
                  Primary
                </span>
              ) : null}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/55 px-1 py-0.5 opacity-0 transition group-hover:opacity-100">
                {i !== 0 ? (
                  <button
                    type="button"
                    onClick={() => makePrimary(u)}
                    className="text-[10px] text-white hover:underline"
                  >
                    Set primary
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => remove(u)}
                  className="text-[10px] text-white hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          No images yet. Upload files or paste image URLs — the first image is the primary.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={uploading}
          onClick={() => fileRef.current?.click()}
        >
          Upload files
        </Button>
        <span className="text-xs text-muted-foreground">or</span>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…/image.jpg"
          className="h-9 max-w-xs"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addUrl();
            }
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={addUrl}>
          Add URL
        </Button>
      </div>
    </div>
  );
}
