"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type JSX, useState, useEffect } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { LanguageSwitcher } from "@/components/molecules/shared/language-switcher";
import { VisitorPresenceBadge } from "@/components/molecules/presence/visitor-presence-badge";
import { TerminalFeaturesModal } from "@/components/molecules/shared/terminal-features-modal";
import * as Dialog from "@radix-ui/react-dialog";

const NAV_LINKS = [
  { key: "navHome" as const, href: "/" },
  { key: "navAbout" as const, href: "/about" },
  { key: "navProjects" as const, href: "/projects" },
  { key: "navBlog" as const, href: "/blog" },
  { key: "navContact" as const, href: "/contact" },
  { key: "navRoadmap" as const, href: "/roadmap" },
] as const;

interface SiteNavProps {
  currentPath?: string;
}

export function SiteNav({ currentPath }: SiteNavProps): JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const activePath = currentPath ?? pathname ?? "";
  const { t } = useI18n();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile navigation menu on route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur supports-backdrop-filter:bg-neutral-950/80">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3"
        >
          <Link
            href="/"
            className="font-mono text-sm font-bold text-green-400 hover:text-green-300"
          >
            infinitedim
          </Link>

          <ul className="hidden items-center gap-1 sm:flex">
            {NAV_LINKS.map(({ key, href }) => {
              const isActive =
                href === "/" ? activePath === "/" : activePath.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    prefetch={false}
                    className={`rounded px-3 py-1.5 font-mono text-xs transition-colors ${
                      isActive
                        ? "bg-green-400/10 text-green-400"
                        : "text-neutral-400 hover:text-neutral-100"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {t(key)}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            <VisitorPresenceBadge />
            <LanguageSwitcher
              variant="dropdown"
              showFlags={false}
              className="hidden sm:block"
            />
            <button
              onClick={() => setIsModalOpen(true)}
              className="rounded border border-green-400/40 bg-green-400/10 px-3 py-1.5 font-mono text-xs text-green-400 transition-colors hover:bg-green-400/20 cursor-pointer"
            >
              {t("navTerminal")} →
            </button>

            {/* Radix Dialog for Mobile Navigation Menu */}
            <Dialog.Root
              open={isMobileMenuOpen}
              onOpenChange={setIsMobileMenuOpen}
            >
              <Dialog.Trigger asChild>
                <button
                  className="rounded p-1.5 text-neutral-400 hover:text-neutral-100 sm:hidden focus:outline-none focus:ring-1 focus:ring-green-400 cursor-pointer"
                  aria-label="Toggle navigation menu"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </Dialog.Trigger>

              <Dialog.Portal>
                {/* Backdrop Overlay */}
                <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sm:hidden animate-fade-in" />

                {/* Mobile Menu Drawer */}
                <Dialog.Content className="fixed inset-y-0 right-0 z-50 w-64 bg-neutral-950 border-l border-neutral-800 p-6 sm:hidden flex flex-col font-mono focus:outline-none">
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title className="text-sm font-bold text-green-400">
                      Navigation
                    </Dialog.Title>
                    <Dialog.Close asChild>
                      <button
                        className="rounded p-1.5 text-neutral-400 hover:text-neutral-100 focus:outline-none cursor-pointer"
                        aria-label="Close menu"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </Dialog.Close>
                  </div>

                  <Dialog.Description className="sr-only">
                    Mobile navigation links
                  </Dialog.Description>

                  <ul className="flex flex-col gap-3">
                    {NAV_LINKS.map(({ key, href }) => {
                      const isActive =
                        href === "/"
                          ? activePath === "/"
                          : activePath.startsWith(href);
                      return (
                        <li key={href}>
                          <Link
                            href={href}
                            prefetch={false}
                            className={`block rounded px-3 py-2 text-sm transition-colors ${
                              isActive
                                ? "bg-green-400/10 text-green-400"
                                : "text-neutral-400 hover:text-neutral-100"
                            }`}
                            aria-current={isActive ? "page" : undefined}
                          >
                            {t(key)}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="mt-auto pt-6 border-t border-neutral-800 flex justify-end">
                    <LanguageSwitcher
                      variant="dropdown"
                      showFlags={false}
                    />
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </nav>
      </header>

      <TerminalFeaturesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProceed={() => {
          setIsModalOpen(false);
          router.push("/gate");
        }}
      />
    </>
  );
}
