"use client";

import { useState, useRef, useCallback } from "react";
import { authService } from "@/lib/auth/auth-service";

import { getApiUrl } from "@/lib/api/get-api-url";
import { Upload } from "lucide-react";

/**
 * Maximum permitted file size for image uploads in bytes (5 MB).
 * @constant {number}
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Array of accepted image MIME content types allowed for upload.
 * @constant {string[]}
 */
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Server response schema returned after a successful image upload.
 *
 * @interface UploadResponse
 * @property {string} url - The publicly accessible URL of the uploaded image resource.
 * @property {string} filename - The stored filename generated or preserved by the backend.
 * @property {number} size - The uploaded file size in bytes.
 * @property {string} mimeType - The MIME type of the stored image.
 */
interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

/**
 * Uploads a blog image file to the backend image upload endpoint using bearer authentication.
 *
 * Validates the file format and size constraints before dispatching the multipart form request.
 *
 * @async
 * @function uploadBlogImage
 * @param {File} file - The image file to upload.
 * @returns {Promise<string | null>} The public URL of the uploaded image, or `null` if the upload fails or validation fails.
 */
export async function uploadBlogImage(file: File): Promise<string | null> {
  if (!ACCEPTED_TYPES.includes(file.type)) return null;
  if (file.size > MAX_FILE_SIZE) return null;

  const token = authService.getAccessToken();
  if (!token) return null;

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${getApiUrl()}/api/upload/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) return null;
  const data: UploadResponse = await response.json();
  return data.url;
}

/**
 * Props for the {@link ImageUploadButton} component.
 *
 * @interface ImageUploadButtonProps
 * @property {(url: string) => void} onUploadComplete - Callback invoked with the uploaded image's public URL upon successful upload.
 * @property {boolean} [disabled] - Disables the upload trigger button.
 * @property {string} [className=""] - Optional extra CSS class names for styling the button container.
 */
interface ImageUploadButtonProps {
  onUploadComplete: (url: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * A button component that triggers an image file selection dialog and uploads the selected image to the server.
 *
 * @component
 * @param {ImageUploadButtonProps} props - Properties configuring the image upload button.
 * @returns {React.JSX.Element} The rendered image upload button and error message display.
 */
export function ImageUploadButton({
  onUploadComplete,
  disabled,
  className = "",
}: ImageUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Programmatically opens the hidden file input dialog when the button is clicked.
   *
   * @returns {void}
   */
  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Validates and performs the multipart upload of the selected image file.
   *
   * @async
   * @param {File} file - The file selected by the user.
   * @returns {Promise<void>} Resolves when the upload process finishes.
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

  /**
   * Event handler for the file input change event.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - Change event from the file input element.
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
        <span className="flex items-center justify-center gap-1">
          <Upload size={12} />
          {isUploading ? "Uploading..." : "Upload Image"}
        </span>
      </button>
      {error && <span className="text-xs text-red-400 mt-1">{error}</span>}
    </div>
  );
}

/**
 * Props for the {@link ImageDropZone} component.
 *
 * @interface ImageDropZoneProps
 * @property {(url: string) => void} onUploadComplete - Callback invoked with the uploaded image's public URL upon successful drop and upload.
 * @property {React.ReactNode} children - Child elements wrapped inside the drag and drop area.
 * @property {string} [className=""] - Optional CSS class name for the wrapper container.
 */
interface ImageDropZoneProps {
  onUploadComplete: (url: string) => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * A drag-and-drop container component that accepts dropped image files and uploads them automatically.
 *
 * @component
 * @param {ImageDropZoneProps} props - Properties configuring the drop zone container.
 * @returns {React.JSX.Element} The rendered drop zone wrapper with visual drag overlay.
 */
export function ImageDropZone({
  onUploadComplete,
  children,
  className = "",
}: ImageDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const dragCountRef = useRef(0);

  /**
   * Uploads the dropped file to the backend API.
   *
   * @async
   * @param {File} file - Dropped image file to upload.
   * @returns {Promise<void>} Resolves when upload completes.
   */
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

  /**
   * Handles drag enter events to track drag depth and activate the visual drag overlay.
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
   * Handles drag leave events to decrement drag counter and dismiss overlay when dragging exits.
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
   * Handles drag over events to allow dropping items by preventing default browser handling.
   *
   * @param {React.DragEvent} e - Drag event object.
   * @returns {void}
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  /**
   * Handles drop events to extract dropped image files and initiate file upload.
   *
   * @param {React.DragEvent} e - Drag event object containing dropped files.
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
            {isUploading ? "Uploading..." : "Drop image here"}
          </span>
        </div>
      )}
    </div>
  );
}
