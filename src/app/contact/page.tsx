import { Metadata } from "next";
import { type JSX } from "react";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { ContactForm } from "@/components/organisms/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch — send a message and I'll reply via email.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage(): JSX.Element {
  return (
    <StandardPageLayout>
      <ContactForm />
    </StandardPageLayout>
  );
}
