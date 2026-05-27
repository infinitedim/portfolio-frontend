const DEFAULT_API_URL = "http://localhost:8080";

export function getApiUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.BACKEND_URL ??
    DEFAULT_API_URL
  );
}

export function getServerApiUrl(): string {
  return process.env.BACKEND_URL ?? getApiUrl();
}
