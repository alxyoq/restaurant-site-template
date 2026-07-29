import type { NavigationItem } from "@/types/content";

/**
 * Start every new restaurant site here.
 *
 * Replace the placeholder business information, turn optional links on or off,
 * and update the matching files in src/content and public/images.
 */
export const siteConfig = {
  businessName: "Restaurant Name",
  wordmark: {
    topLine: "RESTAURANT NAME",
    bottomLine: "KITCHEN & CAFE",
  },
  tagline: "Fresh food, warm service, and a place for the neighborhood.",
  description:
    "A welcoming neighborhood restaurant serving thoughtfully prepared food in a relaxed setting.",
  siteUrl: "https://example.com",
  locale: "en_US",
  navigation: [
    { href: "/", label: "Home" },
    { href: "/menu", label: "Menu" },
    { href: "/catering-events", label: "Catering & Events" },
    { href: "/gallery", label: "Gallery" },
    { href: "/reviews", label: "Reviews" },
    { href: "/contact", label: "Contact" },
  ] satisfies NavigationItem[],
  contact: {
    phoneDisplay: "(856) 555-0123",
    phoneHref: "+18565550123",
    email: "hello@example.com",
    addressLines: ["123 Main Street", "Your City, ST 00000"],
  },
  hours: [
    { days: "Monday–Thursday", times: "7:00 AM–3:00 PM" },
    { days: "Friday–Saturday", times: "7:00 AM–8:00 PM" },
    { days: "Sunday", times: "8:00 AM–2:00 PM" },
  ],
  ordering: {
    enabled: false,
    label: "Order Online",
    url: "",
  },
  reviews: {
    label: "Read More Reviews on Google",
    url: "",
  },
  social: {
    instagramUrl: "",
    facebookUrl: "",
  },
  newsletter: {
    enabled: true,
    title: "Join Our List",
    description: "Get seasonal menu news, events, and restaurant updates.",
  },
  assets: {
    logo: "/images/brand/logo.svg",
    favicon: "/images/brand/favicon.svg",
    socialImage: "/images/brand/social-card.svg",
  },
} as const;

export const fullAddress = siteConfig.contact.addressLines.join(", ");
export const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
export const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`;
