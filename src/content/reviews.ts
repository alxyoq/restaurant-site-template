import type { Review } from "@/types/content";

/**
 * Replace these prompts with verified customer reviews before launch.
 * Do not invent endorsements or publish private customer information.
 */
export const reviewsContent = {
  title: "Reviews",
  intro:
    "Replace the cards below with real, permission-safe customer reviews from the business’s public profiles.",
  items: [
    {
      name: "Customer Name",
      date: "Review date",
      content:
        "Add a short, authentic customer quote here. One or two sentences is ideal for the homepage.",
      rating: 5,
      source: "Google",
      featured: true,
    },
    {
      name: "Customer Name",
      date: "Review date",
      content:
        "Add a review that highlights the food, service, atmosphere, or another meaningful part of the guest experience.",
      rating: 5,
      source: "Google",
      featured: true,
    },
    {
      name: "Customer Name",
      date: "Review date",
      content:
        "Add another verified review here. Keep the original meaning and avoid editing a quote in a misleading way.",
      rating: 5,
      source: "Facebook",
      featured: true,
    },
    {
      name: "Customer Name",
      date: "Review date",
      content:
        "Use additional cards for reviews that add something distinct, such as catering, takeout, or a family celebration.",
      rating: 5,
      source: "Yelp",
    },
  ] satisfies Review[],
} as const;
