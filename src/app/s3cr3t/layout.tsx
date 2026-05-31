import { Metadata } from "next";
import { type JSX, type ReactNode } from "react";

export const metadata: Metadata = {
  title: "Index of /s3cr3t",
  robots: { index: false, follow: false },
};

export default function S3cr3tLayout({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return <>{children}</>;
}
