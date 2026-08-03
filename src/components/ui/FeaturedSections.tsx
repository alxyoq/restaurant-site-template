import Image from "next/image";
import Link from "next/link";

import previewPolicy from "@/config/preview-policy.json";
import { siteConfig } from "@/config/site";
import { homeContent } from "@/content/home";

export default function FeaturedSections() {
  return (
    <div className="bg-brand-surface py-12 md:py-16">
      <section className="site-container mb-20 text-center">
        <div className="inline-block border-2 border-brand-ink px-7 py-5">
          <div className="flex flex-col items-center">
            <h1 className="text-2xl font-semibold uppercase tracking-wide text-brand-primary md:text-3xl">
              {homeContent.intro.heading}
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium tracking-wide text-brand-ink md:text-base">
              {homeContent.intro.tagline}
            </p>
          </div>
        </div>

        <h2 className="mt-7 text-xl font-semibold text-brand-primary md:text-2xl">
          {homeContent.intro.serviceLine}
        </h2>
        <p className="mt-2 text-sm font-medium text-gray-700 md:text-base">
          {homeContent.intro.hoursSummary}
        </p>

        <hr className="mx-auto my-7 max-w-3xl border-brand-primary/40" />

        <div className="flex flex-wrap justify-center gap-4">
          {homeContent.quickLinks.map(({ href, label }) => (
            <Link key={href} href={href} className="btn-outline text-sm">
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
              className="btn-outline text-sm"
            >
              {siteConfig.ordering.label}
            </a>
          ) : null}
        </div>
      </section>

      <div className="site-container space-y-20">
        {homeContent.sections.map((section) => (
          <section
            key={section.title}
            className="grid items-center gap-9 md:grid-cols-2 md:gap-14"
          >
            <div
              className={
                section.imagePosition === "right" ? "md:order-1" : "md:order-2"
              }
            >
              <h2 className="mb-5 text-3xl text-brand-primary">
                {section.title}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mb-4 leading-7 text-gray-700">
                  {paragraph}
                </p>
              ))}
              {section.cta ? (
                <Link
                  href={section.cta.href}
                  className="btn-primary mt-2 text-sm"
                >
                  {section.cta.label}
                </Link>
              ) : null}
            </div>
            <div
              className={
                section.imagePosition === "right" ? "md:order-2" : "md:order-1"
              }
            >
              <div className="overflow-hidden rounded-2xl shadow-soft">
                <Image
                  src={section.image}
                  alt={section.imageAlt}
                  width={800}
                  height={400}
                  className="h-auto w-full object-cover"
                />
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
