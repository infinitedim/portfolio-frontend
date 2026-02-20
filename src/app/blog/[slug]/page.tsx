import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

function getBackendUrl(): string {
  return (
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3001"
  );
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  contentMd: string | null;
  contentHtml: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/blog/${slug}`, {
      next: { revalidate: 3600 }, 
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error("Failed to fetch blog post:", error);
  }

  return null;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    return {
      title: "Post Not Found | Blog",
      description: "The requested blog post could not be found.",
    };
  }

  return {
    title: `${post.title} | Blog`,
    description: post.summary ?? post.title,
    openGraph: {
      title: post.title,
      description: post.summary ?? post.title,
      type: "article",
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary ?? post.title,
    },
  };
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(
      `${backendUrl}/api/blog?pageSize=100&published=true`,
      { next: { revalidate: 3600 } }
    );

    if (response.ok) {
      const data = await response.json();
      return (data.items || []).map((post: { slug: string }) => ({
        slug: post.slug,
      }));
    }
  } catch (error) {
    console.error("Failed to generate static params:", error);
  }

  return [];
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  
  if (!post.published) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        
        <nav className="mb-8">
          <Link
            href="/blog"
            className="text-green-400 hover:text-green-300 transition-colors"
          >
            ← Back to Blog
          </Link>
        </nav>

        
        <article className="prose prose-invert prose-green max-w-none">
          
          <header className="mb-8 not-prose">
            <h1 className="text-4xl font-bold text-green-400 mb-4">
              {post.title}
            </h1>
            {post.summary && (
              <p className="text-xl text-gray-400 mb-4">{post.summary}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <time dateTime={post.createdAt}>
                Published:{" "}
                {new Date(post.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              {post.updatedAt !== post.createdAt && (
                <time dateTime={post.updatedAt}>
                  Updated:{" "}
                  {new Date(post.updatedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              )}
            </div>
          </header>

          
          <div className="border-t border-gray-800 pt-8">
            {post.contentHtml ? (
              <div
                dangerouslySetInnerHTML={{ __html: post.contentHtml }}
                className="prose prose-invert prose-green max-w-none 
                  prose-headings:text-green-400 
                  prose-a:text-green-400 
                  prose-strong:text-gray-100
                  prose-code:text-green-300
                  prose-code:bg-gray-800
                  prose-code:px-1
                  prose-code:rounded
                  prose-pre:bg-gray-900
                  prose-pre:border
                  prose-pre:border-gray-800"
              />
            ) : post.contentMd ? (
              <div className="whitespace-pre-wrap font-mono text-sm text-gray-300">
                {post.contentMd}
              </div>
            ) : (
              <p className="text-gray-500">No content available.</p>
            )}
          </div>
        </article>

        
        <footer className="mt-12 pt-8 border-t border-gray-800">
          <Link
            href="/blog"
            className="text-green-400 hover:text-green-300 transition-colors"
          >
            ← Back to Blog
          </Link>
        </footer>
      </main>
    </div>
  );
}

export const revalidate = 3600; 
