import type { Metadata } from "next";

import previewPolicy from "@/config/preview-policy.json";
import { siteConfig } from "@/config/site";

export function createPageMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  return {
    title,
    description,
    alternates: previewPolicy.publicLaunchAllowed
      ? {
          canonical: path,
        }
      : undefined,
    openGraph: {
      title: `${title} | ${siteConfig.businessName}`,
      description,
      url: previewPolicy.publicLaunchAllowed ? path : undefined,
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
