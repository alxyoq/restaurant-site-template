import type { Metadata } from "next";

import previewPolicy from "@/config/preview-policy.json";
import { siteConfig } from "@/config/site";

import "./globals.css";

const previewOrigin =
  process.env.DEPLOY_PRIME_URL ?? process.env.URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(
    previewPolicy.publicLaunchAllowed ? siteConfig.siteUrl : previewOrigin,
  ),
  title: {
    default: siteConfig.businessName,
    template: `%s | ${siteConfig.businessName}`,
  },
  description: siteConfig.description,
  alternates: previewPolicy.publicLaunchAllowed
    ? {
        canonical: "/",
      }
    : undefined,
  icons: {
    icon: siteConfig.assets.favicon,
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: previewPolicy.publicLaunchAllowed ? "/" : undefined,
    siteName: siteConfig.businessName,
    title: siteConfig.businessName,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.assets.socialImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.businessName} social preview`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.businessName,
    description: siteConfig.description,
    images: [siteConfig.assets.socialImage],
  },
  robots:
    previewPolicy.searchIndexing === "noindex_nofollow_noarchive"
      ? {
          index: false,
          follow: false,
          noarchive: true,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noarchive: true,
          },
        }
      : undefined,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: siteConfig.businessName,
    description: siteConfig.description,
    url: siteConfig.siteUrl,
    telephone: siteConfig.contact.phoneHref,
    email: siteConfig.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.contact.addressLines[0],
      addressLocality: siteConfig.contact.addressLines[1],
    },
    image: siteConfig.assets.socialImage,
  };

  return (
    <html lang="en">
      <body>
        {previewPolicy.publicLaunchAllowed ? (
          <script type="application/ld+json">
            {JSON.stringify(localBusinessSchema)}
          </script>
        ) : null}
        {children}
      </body>
    </html>
  );
}
