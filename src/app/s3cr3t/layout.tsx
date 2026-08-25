import { Metadata } from "next";
import { type JSX, type ReactNode } from "react";

/**
 * Static metadata configuration for the secret challenge directory layout.
 *
 * @type {Metadata}
 */
export const metadata: Metadata = {
  title: "Index of /s3cr3t",
  robots: { index: false, follow: false },
};

/**
 * Properties for the {@link S3cr3tLayout} component.
 *
 * @interface S3cr3tLayoutProps
 * @property {ReactNode} children - The React child nodes to be rendered inside the layout.
 */
interface S3cr3tLayoutProps {
  children: ReactNode;
}

/**
 * Root layout component for the `/s3cr3t` route segment.
 *
 * @description Provides metadata configuration (disallowing search engine indexing)
 * and passes children through transparently.
 *
 * @param {S3cr3tLayoutProps} props - The component properties.
 * @param {ReactNode} props.children - Child elements to render within the layout.
 * @returns {JSX.Element} The rendered React layout wrapper.
 */
export default function S3cr3tLayout({
  children,
}: S3cr3tLayoutProps): JSX.Element {
  return <>{children}</>;
}
