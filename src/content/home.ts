import { siteConfig } from "@/config/site";
import type { ContentLink, FeaturedSection } from "@/types/content";

export const homeContent = {
  hero: {
    image: "/images/site/hero.svg",
    imageAlt:
      "Replace with a wide hero photo of the restaurant or signature food",
  },
  intro: {
    heading: siteConfig.businessName,
    tagline: siteConfig.tagline,
    serviceLine: "Breakfast · Lunch · Dinner",
    hoursSummary: "See our current hours and location before your visit.",
  },
  quickLinks: [
    { href: "/menu", label: "Menu" },
    { href: "/contact#location", label: "Location" },
  ] satisfies ContentLink[],
  sections: [
    {
      title: `Welcome to ${siteConfig.businessName}`,
      paragraphs: [
        "Replace this paragraph with a short introduction to the restaurant, the people behind it, and what makes the experience memorable.",
        "Keep this section warm and concise. Two short paragraphs usually work better than a long company history.",
      ],
      image: "/images/site/about.svg",
      imageAlt:
        "Replace with a photo of the dining room, team, or restaurant exterior",
      imagePosition: "right",
    },
    {
      title: "Food Made for the Moment",
      paragraphs: [
        "Describe the menu in a few sentences. Mention the restaurant’s specialties, sourcing, cooking style, or the meals it serves.",
      ],
      image: "/images/site/food.svg",
      imageAlt: "Replace with a close-up photo of a signature menu item",
      imagePosition: "left",
      cta: { href: "/menu", label: "View Menu" },
    },
    {
      title: "Catering & Events",
      paragraphs: [
        "Explain what the business offers for celebrations, office meals, private events, or off-site catering.",
        "Invite guests to get in touch for menu options, availability, and pricing.",
      ],
      image: "/images/site/catering.svg",
      imageAlt: "Replace with a photo of a catered spread or private event",
      imagePosition: "right",
      cta: { href: "/catering-events", label: "Plan Your Event" },
    },
  ] satisfies FeaturedSection[],
} as const;
