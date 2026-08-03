"use client";

import { Facebook, Instagram, Menu, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import previewPolicy from "@/config/preview-policy.json";
import { siteConfig } from "@/config/site";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const socialLinks = [
    {
      label: "Instagram",
      href: siteConfig.social.instagramUrl,
      icon: Instagram,
    },
    {
      label: "Facebook",
      href: siteConfig.social.facebookUrl,
      icon: Facebook,
    },
  ].filter((item) => item.href);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-gray-200 bg-white transition-all duration-300 ${
        scrolled ? "h-16 shadow-lg" : "h-20"
      }`}
    >
      <div className="mx-auto flex h-full max-w-screen-xl items-center justify-between px-3 sm:px-5">
        <Link
          href="/"
          className="leading-tight"
          aria-label={`${siteConfig.businessName} home`}
        >
          <div className="rounded-md border border-gray-300 bg-white/80 px-4 py-1 text-center backdrop-blur-md">
            <p className="font-display text-base font-semibold leading-none tracking-wide text-brand-primary md:text-lg">
              {siteConfig.wordmark.topLine}
            </p>
            <p className="mt-0.5 text-[10px] tracking-[0.22em] text-gray-600">
              {siteConfig.wordmark.bottomLine}
            </p>
          </div>
        </Link>

        <nav
          className="hidden items-center gap-4 text-sm text-gray-700 md:flex"
          aria-label="Primary navigation"
        >
          {siteConfig.navigation.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="transition-colors hover:text-brand-primary"
            >
              {label}
            </Link>
          ))}
          {previewPolicy.orderingEnabled &&
          siteConfig.ordering.enabled &&
          siteConfig.ordering.url ? (
            <a
              href={siteConfig.ordering.url}
              target="_blank"
              rel="noreferrer"
              className="btn-outline ml-1 min-h-9 px-3 py-1 text-xs"
            >
              <ShoppingBag size={15} className="mr-1.5" />
              {siteConfig.ordering.label}
            </a>
          ) : null}
          {socialLinks.map(({ label, href, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className="text-brand-primary transition-colors hover:text-brand-secondary"
            >
              <Icon size={17} />
            </a>
          ))}
        </nav>

        <button
          type="button"
          ref={buttonRef}
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded p-2 text-brand-primary md:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {menuOpen && (
        <div
          id="mobile-navigation"
          ref={menuRef}
          className="animate-fadeIn absolute left-0 top-full z-[60] w-full border-t border-gray-100 bg-white px-4 pb-5 pt-3 text-base text-gray-800 shadow-xl md:hidden"
        >
          <nav className="space-y-1" aria-label="Mobile navigation">
            {siteConfig.navigation.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block w-full rounded px-3 py-3 hover:bg-brand-surface"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
          </nav>
          {previewPolicy.orderingEnabled &&
          siteConfig.ordering.enabled &&
          siteConfig.ordering.url ? (
            <a
              href={siteConfig.ordering.url}
              target="_blank"
              rel="noreferrer"
              className="btn-outline mx-auto mt-3 flex w-fit text-sm"
              onClick={() => setMenuOpen(false)}
            >
              <ShoppingBag size={16} className="mr-1.5" />
              {siteConfig.ordering.label}
            </a>
          ) : null}
          {socialLinks.length > 0 ? (
            <div className="flex items-center justify-center gap-5 pt-4">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="text-brand-primary hover:text-brand-secondary"
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </header>
  );
}
