import type { GalleryImage } from "@/types/content";

export const galleryContent = {
  title: "Our Gallery",
  intro:
    "Replace these placeholders with a balanced mix of food, people, atmosphere, exterior, and event photos.",
  images: [
    {
      src: "/images/site/gallery-1.svg",
      alt: "Replace with a signature food photo",
      width: 1200,
      height: 900,
    },
    {
      src: "/images/site/gallery-2.svg",
      alt: "Replace with a restaurant interior photo",
      width: 900,
      height: 1200,
    },
    {
      src: "/images/site/gallery-3.svg",
      alt: "Replace with a drink or dessert photo",
      width: 1200,
      height: 800,
    },
    {
      src: "/images/site/gallery-4.svg",
      alt: "Replace with a team or service photo",
      width: 900,
      height: 1100,
    },
    {
      src: "/images/site/gallery-5.svg",
      alt: "Replace with another signature dish photo",
      width: 1200,
      height: 1200,
    },
    {
      src: "/images/site/gallery-6.svg",
      alt: "Replace with a restaurant exterior photo",
      width: 1200,
      height: 800,
    },
    {
      src: "/images/site/gallery-7.svg",
      alt: "Replace with a catering or event photo",
      width: 900,
      height: 1200,
    },
    {
      src: "/images/site/gallery-8.svg",
      alt: "Replace with a seasonal menu photo",
      width: 1200,
      height: 900,
    },
  ] satisfies GalleryImage[],
} as const;
