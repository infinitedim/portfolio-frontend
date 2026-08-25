import { Metadata } from "next";
import { type JSX } from "react";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { ContactForm } from "@/components/organisms/contact/contact-form";

/**
 * Static SEO and OpenGraph metadata configuration for the contact page.
 */
export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch — send a message and I'll reply via email.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact | Dimas Saputra",
    description: "Get in touch — send a message and I'll reply via email.",
    type: "website",
    url: "/contact",
  },
};

/**
 * Renders the Contact page containing the standard layout wrapper and interactive message contact form.
 *
 * @returns {JSX.Element} The rendered contact page view.
 */
export default function ContactPage(): JSX.Element {
  return (
    <StandardPageLayout>
      <ContactForm />
    </StandardPageLayout>
  );
}
