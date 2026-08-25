"use client";

import { useState, useRef, useCallback, type JSX } from "react";
import type { ThemeConfig } from "@/types/theme";
import { authService } from "@/lib/auth/auth-service";
import { getApiUrl } from "@/lib/api/get-api-url";
import { Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";

const MAX_FILE_SIZE = 5 * 1024 * 1024;       
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

interface ProjectImageUploadProps {
  imageUrl?: string;
  onUploadComplete: (url: string | undefined) => void;
  themeConfig: ThemeConfig;
}

export function ProjectImageUpload({
  imageUrl,
  onUploadComplete,
  themeConfig,
}: ProjectImageUploadProps): JSX.Element {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCountRef = useRef(0);

  const uploadFile = useCallback(
    async (file: File) => {
      setError(null);

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Format not supported. Use JPEG, PNG, WebP, or GIF.");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError("File too large (max 5MB).");
        return;
      }

      const token = authService.getAccessToken();
      if (!token) {
        setError("Please log in to upload images.");
        return;
      }

      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${getApiUrl()}/api/upload/project-image`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (response.ok) {
          const data: UploadResponse = await response.json();
          onUploadComplete(data.url);
        } else {
          const errData = await response.json().catch(() => null);
          setError(errData?.error || `Upload failed (${response.status})`);
        }
      } catch (err) {
        console.error("Project image upload error:", err);
        setError("Network error during upload");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [onUploadComplete],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        uploadFile(file);
      }
    },
    [uploadFile],
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current += 1;
    if (dragCountRef.current === 1) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current -= 1;
    if (dragCountRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCountRef.current = 0;
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find((f) => ACCEPTED_TYPES.includes(f.type));
      if (imageFile) {
        uploadFile(imageFile);
      }
    },
    [uploadFile],
  );

  const handleRemove = useCallback(() => {
    onUploadComplete(undefined);
    setError(null);
  }, [onUploadComplete]);

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      {imageUrl ? (
        <div
          className="relative flex items-center gap-3 p-2 border rounded"
          style={{ borderColor: themeConfig.colors.border }}
        >
          <div className="relative w-16 h-12 rounded overflow-hidden bg-black/20 shrink-0">
            <Image
              src={imageUrl}
              alt="Project image preview"
              fill
              className="object-cover"
              sizes="64px"
              unoptimized={!imageUrl.startsWith("https://storage.googleapis.com")}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs truncate font-mono opacity-80">{imageUrl}</p>
            <p className="text-[10px] text-green-400">Uploaded & ready</p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="p-1 text-xs border rounded transition-colors hover:text-red-400 hover:border-red-400/50 shrink-0"
            style={{ borderColor: themeConfig.colors.border }}
            title="Remove image"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 ${
            isDragging
              ? "border-green-400 bg-green-400/10"
              : "hover:border-green-400/50 hover:bg-black/10"
          }`}
          style={{ borderColor: isDragging ? undefined : themeConfig.colors.border }}
        >
          {isUploading ? (
            <div className="flex items-center gap-2 text-xs opacity-80 py-2">
              <Loader2 size={16} className="animate-spin text-green-400" />
              <span>Uploading to GCS...</span>
            </div>
          ) : (
            <>
              <div className="p-2 rounded-full bg-black/20 opacity-70">
                <Upload size={18} />
              </div>
              <div className="text-xs space-y-0.5">
                <p className="font-medium">
                  <span className="text-green-400">Click to upload</span> or drag and drop
                </p>
                <p className="text-[10px] opacity-60">PNG, JPG, WebP or GIF (max 5MB)</p>
              </div>
            </>
          )}
        </button>
      )}

      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
