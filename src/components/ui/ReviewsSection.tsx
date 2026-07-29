import Link from "next/link";

import { reviewsContent } from "@/content/reviews";

import ReviewCard from "./ReviewCard";

export default function ReviewsSection() {
  const featuredReviews = reviewsContent.items.filter(
    (review) => review.featured,
  );

  return (
    <section className="bg-brand-surface py-16">
      <div className="site-container">
        <h2 className="mb-10 text-center text-4xl text-brand-primary">
          {reviewsContent.title}
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {featuredReviews.map((review, index) => (
            <ReviewCard
              key={`${review.name}-${review.date}-${index}`}
              review={review}
            />
          ))}
        </div>

        <div className="mt-9 text-center">
          <Link href="/reviews" className="btn-outline inline-block">
            Read More →
          </Link>
        </div>
      </div>
    </section>
  );
}
