import { ImageResponse } from "next/og";
import { getCachedBlogPost } from "@/lib/services/cached-blog-fetch";

export const alt = "Blog Post Preview Banner";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let title = "Blog Post";
  let summary = "Read articles and insights on web development and architecture.";
  let readingTimeMinutes = 5;
  let tags: string[] = [];

  try {
    const post = await getCachedBlogPost(slug, "en");
    if (post) {
      title = post.title;
      summary = post.summary || summary;
      readingTimeMinutes = post.readingTimeMinutes || 5;
      tags = post.tags || [];
    }
  } catch (e) {
    console.error("Failed to fetch blog post for OG image:", e);
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#0d1117",
          color: "#e6edf3",
          padding: "50px 60px",
          fontFamily: "monospace, sans-serif",
          border: "4px solid #238636",
          boxSizing: "border-box",
        }}
      >
        {/* Terminal Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            width: "100%",
            borderBottom: "1px solid #30363d",
            paddingBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginRight: "12px",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "#ff5f56",
              }}
            />
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "#ffbd2e",
              }}
            />
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "#27c93f",
              }}
            />
          </div>
          <span style={{ color: "#3fb950", fontSize: "22px", fontWeight: "bold" }}>
            $
          </span>
          <span style={{ color: "#8b949e", fontSize: "20px" }}>
            cat /blog/{slug}
          </span>
        </div>

        {/* Content Body */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            flex: 1,
            justifyContent: "center",
            margin: "20px 0",
          }}
        >
          <div
            style={{
              fontSize: "44px",
              fontWeight: "bold",
              color: "#ffffff",
              lineHeight: 1.2,
              maxHeight: "160px",
              overflow: "hidden",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: "22px",
              color: "#8b949e",
              lineHeight: 1.4,
              maxHeight: "90px",
              overflow: "hidden",
            }}
          >
            {summary}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            borderTop: "1px solid #30363d",
            paddingTop: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                color: "#3fb950",
                fontSize: "22px",
                fontWeight: "bold",
              }}
            >
              infinitedim.dev
            </span>
            <span style={{ color: "#484f58", fontSize: "20px" }}>|</span>
            <span style={{ color: "#8b949e", fontSize: "18px" }}>
              {readingTimeMinutes} min read
            </span>
          </div>

          {tags.length > 0 && (
            <div style={{ display: "flex", gap: "8px" }}>
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  style={{
                    backgroundColor: "rgba(63, 185, 80, 0.15)",
                    color: "#3fb950",
                    border: "1px solid rgba(63, 185, 80, 0.3)",
                    borderRadius: "6px",
                    padding: "4px 12px",
                    fontSize: "16px",
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
