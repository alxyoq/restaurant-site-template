import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

export function createPageMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: `${title} | ${siteConfig.businessName}`,
      description,
      url: path,
      type: "website",
      images: [
        {
          url: siteConfig.assets.socialImage,
          width: 1200,
          height: 630,
          alt: `${siteConfig.businessName} social preview`,
        },
      ],
    },
  };
}
