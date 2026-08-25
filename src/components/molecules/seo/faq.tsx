"use client";

import { useState, type JSX } from "react";

/**
 * Renders a downward-pointing chevron icon for collapsed accordion states.
 *
 * @returns An SVG icon element.
 */
const ChevronDownIcon = (): JSX.Element => (
  <svg
    className="w-5 h-5 text-gray-500"
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path
      fillRule="evenodd"
      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);

/**
 * Renders an upward-pointing chevron icon for expanded accordion states.
 *
 * @returns An SVG icon element.
 */
const ChevronUpIcon = (): JSX.Element => (
  <svg
    className="w-5 h-5 text-gray-500"
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path
      fillRule="evenodd"
      d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
      clipRule="evenodd"
    />
  </svg>
);

/**
 * Represents an individual FAQ entry containing a question and its corresponding answer.
 */
interface FAQItem {
  /** The question header text. */
  question: string;
  /** The full answer body text. */
  answer: string;
}

/**
 * Props for the {@link FAQ} accordion component.
 */
interface FAQProps {
  /** Array of question and answer pairs conforming to {@link FAQItem}. */
  items: FAQItem[];
  /** Optional section heading title. Defaults to "Frequently Asked Questions". */
  title?: string;
  /** Optional custom CSS classes for the root container. */
  className?: string;
}

/**
 * Renders an accessible interactive FAQ accordion with Schema.org JSON-LD structured data.
 *
 * @description Generates a `schema.org/FAQPage` structured data script and accessible
 * expandable/collapsible accordion panels with full ARIA attributes (`aria-expanded`, `aria-controls`).
 *
 * @param props - Component properties conforming to {@link FAQProps}.
 * @param props.items - Array of question and answer pairs conforming to {@link FAQItem}.
 * @param props.title - Optional section heading title.
 * @param props.className - Optional custom CSS classes for the root container.
 * @returns A JSX element containing the JSON-LD script and accordion list.
 */
export function FAQ({
  items,
  title = "Frequently Asked Questions",
  className = "",
}: FAQProps): JSX.Element {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  /**
   * Toggles the open/closed state of an FAQ item at the specified index.
   *
   * @param index - Numerical index of the clicked accordion item.
   */
  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        {title}
      </h2>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleItem(index)}
              className="w-full px-6 py-4 text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
              aria-expanded={openItems.has(index)}
              aria-controls={`faq-answer-${index}`}
            >
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {item.question}
              </span>
              {openItems.has(index) ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </button>

            {openItems.has(index) && (
              <div
                id={`faq-answer-${index}`}
                className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700"
              >
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Standard list of frequently asked questions regarding developer background, stack, and services.
 */
export const CommonFAQItems: FAQItem[] = [
  {
    question: "What technologies do you specialize in?",
    answer:
      "I specialize in modern web development technologies including React, Next.js, TypeScript, Node.js, and various other frontend and backend technologies. I have experience with both client-side and server-side development, as well as database design and API development.",
  },
  {
    question: "Do you take on freelance projects?",
    answer:
      "Yes, I'm available for freelance projects. I can help with full-stack web development, frontend development, backend development, and technical consulting. Feel free to reach out to discuss your project requirements.",
  },
  {
    question: "What is your development process?",
    answer:
      "My development process typically involves understanding requirements, planning the architecture, developing iteratively with regular feedback, testing thoroughly, and deploying with proper documentation. I believe in clean code, best practices, and delivering high-quality solutions.",
  },
  {
    question: "How long does it typically take to complete a project?",
    answer:
      "Project timelines vary depending on complexity, features, and requirements. A simple website might take 1-2 weeks, while a complex web application could take 2-3 months or more. I always provide detailed timelines during the planning phase.",
  },
  {
    question: "Do you provide ongoing maintenance and support?",
    answer:
      "Yes, I offer ongoing maintenance and support services. This includes bug fixes, feature updates, security patches, performance optimization, and technical support. We can discuss maintenance packages that fit your needs.",
  },
  {
    question: "What makes your portfolio different?",
    answer:
      "My portfolio features an interactive terminal interface that showcases not just my projects, but also my technical skills and creativity. It demonstrates my ability to create unique user experiences and my passion for innovative web development.",
  },
  {
    question: "Can you work with existing codebases?",
    answer:
      "Absolutely! I have experience working with existing codebases, legacy systems, and team environments. I can help refactor, improve, or extend existing applications while maintaining code quality and following best practices.",
  },
  {
    question: "What is your approach to responsive design?",
    answer:
      "I prioritize mobile-first responsive design to ensure optimal user experience across all devices. I use modern CSS techniques, flexible layouts, and thorough testing to create websites that work seamlessly on desktop, tablet, and mobile devices.",
  },
];

/**
 * Renders a specialized FAQ section with pre-populated developer service questions.
 *
 * @returns A JSX element rendering the developer services FAQ section.
 */
export function DeveloperFAQ(): JSX.Element {
  return (
    <FAQ
      title="Developer Services FAQ"
      items={CommonFAQItems}
      className="max-w-4xl mx-auto"
    />
  );
}

