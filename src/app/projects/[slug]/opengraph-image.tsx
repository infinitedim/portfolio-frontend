import { ImageResponse } from "next/og";
import { getProjectsData } from "@/lib/data/data-fetching";

/**
 * Image alt text descriptor for the generated OpenGraph preview banner.
 */
export const alt = "Project Detail Preview Banner";

/**
 * Dimensions configuration for the dynamically generated OpenGraph project banner.
 */
export const size = {
  width: 1200,
  height: 630,
};

/**
 * MIME type for the generated OpenGraph image response.
 */
export const contentType = "image/png";

/**
 * Route handler generating dynamic OpenGraph and Twitter preview card images for individual projects.
 *
 * @description Fetches project metadata for the specified slug and dynamically renders a terminal-themed
 * PNG banner containing the project name, description, status badge, and tech stack tags using Next.js `ImageResponse`.
 *
 * @param {object} props - Component route parameters.
 * @param {Promise<{ slug: string }>} props.params - Asynchronous route parameters containing the project slug.
 * @returns {Promise<ImageResponse>} Dynamic OpenGraph image response.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let name = "Project Case Study";
  let description = "Explore software development case studies and technical architecture.";
  let technologies: string[] = [];
  let status = "Completed";

  try {
    const projects = await getProjectsData();
    const project = projects.find((p) => p.slug === slug);
    if (project) {
      name = project.name;
      description = project.description || description;
      technologies = project.technologies || [];
      status = project.status || "Completed";
    }
  } catch (e) {
    console.error("Failed to fetch project for OG image:", e);
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
            ./view-project --name {slug}
          </span>
        </div>

                            
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
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                fontSize: "44px",
                fontWeight: "bold",
                color: "#ffffff",
                lineHeight: 1.2,
                maxHeight: "110px",
                overflow: "hidden",
              }}
            >
              {name}
            </div>
            <span
              style={{
                backgroundColor: "rgba(39, 201, 63, 0.15)",
                color: "#27c93f",
                border: "1px solid rgba(39, 201, 63, 0.3)",
                borderRadius: "6px",
                padding: "4px 12px",
                fontSize: "14px",
                textTransform: "uppercase",
              }}
            >
              {status}
            </span>
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
            {description}
          </div>
        </div>

                      
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
              Project Showcase
            </span>
          </div>

          {technologies.length > 0 && (
            <div style={{ display: "flex", gap: "8px" }}>
              {technologies.slice(0, 4).map((tech) => (
                <span
                  key={tech}
                  style={{
                    backgroundColor: "rgba(63, 185, 80, 0.15)",
                    color: "#3fb950",
                    border: "1px solid rgba(63, 185, 80, 0.3)",
                    borderRadius: "6px",
                    padding: "4px 12px",
                    fontSize: "16px",
                  }}
                >
                  {tech}
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
