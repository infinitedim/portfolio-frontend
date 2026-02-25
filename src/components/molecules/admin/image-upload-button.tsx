"use client";

import { useState, useRef, useCallback } from "react";
import { authService } from "@/lib/auth/auth-service";

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

interface ImageUploadButtonProps {
  onUploadComplete: (url: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ImageUploadButton({
  onUploadComplete,
  disabled,
  className = "",
}: ImageUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

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

        const response = await fetch(`${getApiUrl()}/api/upload/image`, {
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
        console.error("Upload error:", err);
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

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isUploading}
        className="px-3 py-1 text-xs border rounded transition-colors border-gray-600 text-gray-300 hover:border-green-400/50 hover:text-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? "⏳ Uploading..." : "🖼️ Upload Image"}
      </button>
      {error && <span className="text-xs text-red-400 mt-1">{error}</span>}
    </div>
  );
}

interface ImageDropZoneProps {
  onUploadComplete: (url: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function ImageDropZone({
  onUploadComplete,
  children,
  className = "",
}: ImageDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const dragCountRef = useRef(0);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) return;
      if (file.size > MAX_FILE_SIZE) return;

      const token = authService.getAccessToken();
      if (!token) return;

      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${getApiUrl()}/api/upload/image`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (response.ok) {
          const data: UploadResponse = await response.json();
          onUploadComplete(data.url);
        }
      } catch (err) {
        console.error("Drop upload error:", err);
      } finally {
        setIsUploading(false);
      }
    },
    [onUploadComplete],
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

  return (
    <div
      className={`relative ${className}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
      {(isDragging || isUploading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 border-2 border-dashed border-green-400/60 rounded-lg z-10 pointer-events-none">
          <span className="text-sm text-green-400">
            {isUploading ? "⏳ Uploading..." : "📁 Drop image here"}
          </span>
        </div>
      )}
    </div>
  );
}
