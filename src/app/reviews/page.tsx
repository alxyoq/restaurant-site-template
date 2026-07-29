import type { Metadata } from "next";

import Layout from "@/components/layout/Layout";
import ReviewCard from "@/components/ui/ReviewCard";
import { siteConfig } from "@/config/site";
import { reviewsContent } from "@/content/reviews";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata(
  "Reviews",
  "Read customer reviews and learn about the restaurant experience.",
  "/reviews",
);

export default function ReviewsPage() {
  return (
    <Layout>
      <div className="bg-brand-surface py-14 md:py-16">
        <div className="site-container">
          <h1 className="page-heading">{reviewsContent.title}</h1>
          <p className="page-intro">{reviewsContent.intro}</p>

          <div className="mt-12 grid gap-7 md:grid-cols-2">
            {reviewsContent.items.map((review, index) => (
              <ReviewCard
                key={`${review.name}-${review.date}-${index}`}
                review={review}
              />
            ))}
          </div>

          {siteConfig.reviews.url ? (
            <div className="mt-12 text-center">
              <a
                href={siteConfig.reviews.url}
                target="_blank"
                rel="noreferrer"
                className="btn-outline"
              >
                {siteConfig.reviews.label}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </Layout>
  );
}
