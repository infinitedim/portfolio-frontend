"use client";

import { useState, useRef, useCallback, type JSX } from "react";
import type { ThemeConfig } from "@/types/theme";
import { authService } from "@/lib/auth/auth-service";
import { getApiUrl } from "@/lib/api/get-api-url";
import { Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";

/**
 * Maximum permitted file size for project image uploads in bytes (5 MB).
 * @constant {number}
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Array of accepted image MIME types for project image uploads.
 * @constant {string[]}
 */
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Server response schema returned after a successful project image upload.
 *
 * @interface UploadResponse
 * @property {string} url - The publicly accessible URL of the uploaded image resource.
 * @property {string} filename - Stored filename on the server or Google Cloud Storage.
 * @property {number} size - Uploaded file size in bytes.
 * @property {string} mimeType - The MIME content type of the image.
 */
interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

/**
 * Props for the {@link ProjectImageUpload} component.
 *
 * @interface ProjectImageUploadProps
 * @property {string} [imageUrl] - Optional current image URL to display in preview mode.
 * @property {(url: string | undefined) => void} onUploadComplete - Callback invoked with the new image URL when uploaded, or `undefined` when removed.
 * @property {ThemeConfig} themeConfig - Theme configuration object for colors and styling borders.
 */
interface ProjectImageUploadProps {
  imageUrl?: string;
  onUploadComplete: (url: string | undefined) => void;
  themeConfig: ThemeConfig;
}

/**
 * An admin UI component for uploading, previewing, and removing project showcase images.
 *
 * Supports drag-and-drop file uploading, file selection, format/size validation,
 * and direct deletion with live preview of the uploaded image.
 *
 * @component
 * @param {ProjectImageUploadProps} props - Properties configuring the project image upload component.
 * @returns {JSX.Element} The rendered project image upload dropzone or preview card.
 */
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

  /**
   * Validates and executes the multipart upload of a project image file to GCS.
   *
   * @async
   * @param {File} file - The image file to validate and upload.
   * @returns {Promise<void>} Resolves when upload completes or fails.
   */
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

  /**
   * Handles native file input change event.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event.
   * @returns {void}
   */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        uploadFile(file);
      }
    },
    [uploadFile],
  );

  /**
   * Handles drag enter events to activate the drag overlay.
   *
   * @param {React.DragEvent} e - Drag event object.
   * @returns {void}
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current += 1;
    if (dragCountRef.current === 1) {
      setIsDragging(true);
    }
  }, []);

  /**
   * Handles drag leave events to deactivate the drag overlay.
   *
   * @param {React.DragEvent} e - Drag event object.
   * @returns {void}
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current -= 1;
    if (dragCountRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  /**
   * Handles drag over events to permit dropping files.
   *
   * @param {React.DragEvent} e - Drag event object.
   * @returns {void}
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  /**
   * Handles drop events to extract and upload dragged image files.
   *
   * @param {React.DragEvent} e - Drag event object with dropped files.
   * @returns {void}
   */
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

  /**
   * Clears the current project image and notifies parent handler.
   *
   * @returns {void}
   */
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
