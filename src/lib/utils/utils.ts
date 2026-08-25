import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges multiple CSS class names or conditional class objects into a single optimized Tailwind CSS class string.
 *
 * @param inputs - Variable number of class values, objects, or arrays to merge.
 * @returns The resolved and deduplicated Tailwind CSS class string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a unique pseudo-random identifier string combining base-36 timestamp and random suffix.
 *
 * @returns A unique identifier string.
 */
export function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

/**
 * Formats a Date object or numeric millisecond timestamp into a standardized `YYYY-MM-DD HH:mm:ss` string.
 *
 * @param dateInput - The Date instance or millisecond epoch timestamp to format.
 * @returns The formatted date and time string in `YYYY-MM-DD HH:mm:ss` format.
 */
export function formatTimestamp(dateInput: Date | number): string {
  const date = typeof dateInput === "number" ? new Date(dateInput) : dateInput;

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

