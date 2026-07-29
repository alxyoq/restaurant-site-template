import type { Metadata } from "next";

import Layout from "@/components/layout/Layout";
import { menuContent } from "@/content/menu";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata(
  "Menu",
  "Browse breakfast, lunch, specialty, beverage, and catering selections.",
  "/menu",
);

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function MenuPage() {
  return (
    <Layout>
      <div className="bg-brand-surface py-14 md:py-16">
        <div className="site-container">
          <h1 className="page-heading">{menuContent.title}</h1>
          <p className="page-intro">{menuContent.intro}</p>

          <nav
            className="mx-auto my-10 flex max-w-5xl flex-wrap justify-center gap-3"
            aria-label="Menu categories"
          >
            {menuContent.sections.map((section) => (
              <a
                key={section.title}
                href={`#${slugify(section.title)}`}
                className="btn-outline min-h-10 px-4 py-2 text-sm"
              >
                {section.title}
              </a>
            ))}
          </nav>

          <div className="mx-auto max-w-5xl space-y-12">
            {menuContent.sections.map((section) => (
              <section
                key={section.title}
                id={slugify(section.title)}
                className="scroll-mt-24"
              >
                <div className="mb-6 text-center">
                  <h2 className="text-3xl text-brand-primary">
                    {section.title}
                  </h2>
                  {section.description ? (
                    <p className="mt-2 text-gray-600">{section.description}</p>
                  ) : null}
                </div>

                <div className="content-card divide-y divide-gray-100 overflow-hidden">
                  {section.items.map((item) => (
                    <article
                      key={`${section.title}-${item.name}`}
                      className="grid gap-2 p-5 sm:grid-cols-[1fr_auto] sm:gap-x-8 md:p-6"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl text-brand-ink">
                            {item.name}
                          </h3>
                          {item.tags?.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-brand-secondary/10 px-2.5 py-1 text-xs font-semibold text-brand-secondary"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        {item.description ? (
                          <p className="mt-2 leading-6 text-gray-600">
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                      <p className="font-semibold text-brand-primary sm:text-right">
                        {item.price}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <p className="mx-auto mt-12 max-w-3xl text-center text-sm leading-6 text-gray-600">
            {menuContent.notice}
          </p>
        </div>
      </div>
    </Layout>
  );
}
