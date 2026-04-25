"use client";

import dynamic from "next/dynamic";
import { CommentsSkeleton } from "./giscus-comments";

const GiscusComments = dynamic(
  () =>
    import("./giscus-comments").then((mod) => ({
      default: mod.GiscusComments,
    })),
  { ssr: false, loading: () => <CommentsSkeleton /> },
);

export { GiscusComments };
