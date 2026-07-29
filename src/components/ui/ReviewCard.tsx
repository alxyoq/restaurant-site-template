import { Star } from "lucide-react";

import type { Review } from "@/types/content";

export default function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="content-card flex h-full flex-col p-6">
      <div className="mb-4 flex" aria-label={`${review.rating} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={`${review.name}-star-${index}`}
            size={18}
            fill={index < review.rating ? "currentColor" : "none"}
            className={
              index < review.rating ? "text-brand-accent" : "text-gray-300"
            }
            aria-hidden="true"
          />
        ))}
      </div>
      <blockquote className="flex-grow leading-7 text-gray-700">
        “{review.content}”
      </blockquote>
      <footer className="mt-5 border-t border-gray-100 pt-4 text-sm text-gray-500">
        <span className="font-semibold text-brand-ink">{review.name}</span>
        <span aria-hidden="true"> · </span>
        <span>{review.date}</span>
        <span aria-hidden="true"> · </span>
        {review.link ? (
          <a
            href={review.link}
            target="_blank"
            rel="noreferrer"
            className="text-brand-primary hover:text-brand-secondary"
          >
            {review.source}
          </a>
        ) : (
          <span>{review.source}</span>
        )}
      </footer>
    </article>
  );
}
