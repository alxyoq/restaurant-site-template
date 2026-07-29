import type { Metadata } from "next";
import Image from "next/image";

import Layout from "@/components/layout/Layout";
import { siteConfig } from "@/config/site";
import { cateringContent } from "@/content/catering";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata(
  "Catering & Events",
  "Plan restaurant catering, private events, celebrations, and group meals.",
  "/catering-events",
);

export default function CateringEventsPage() {
  return (
    <Layout>
      <div className="bg-brand-surface py-14 md:py-16">
        <div className="site-container">
          <h1 className="page-heading">{cateringContent.title}</h1>
          <p className="page-intro">{cateringContent.intro}</p>

          <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl shadow-soft">
            <Image
              src={cateringContent.mainImage.src}
              alt={cateringContent.mainImage.alt}
              width={1200}
              height={700}
              className="h-auto w-full object-cover"
              priority
            />
          </div>

          <div className="mx-auto mt-10 max-w-3xl space-y-4 text-center leading-7 text-gray-700">
            {cateringContent.details.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="my-10 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href={`mailto:${siteConfig.contact.email}?subject=Catering%20Inquiry`}
              className="btn-primary"
            >
              Request Catering Information
            </a>
            <a
              href={`tel:${siteConfig.contact.phoneHref}`}
              className="btn-outline"
            >
              Call {siteConfig.contact.phoneDisplay}
            </a>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {cateringContent.gallery.map((image) => (
              <div
                key={image.src}
                className="overflow-hidden rounded-2xl shadow-soft"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={800}
                  height={600}
                  className="h-auto w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
