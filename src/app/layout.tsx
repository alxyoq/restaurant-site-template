import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: siteConfig.businessName,
    template: `%s | ${siteConfig.businessName}`,
  },
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: siteConfig.assets.favicon,
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: "/",
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
        <script type="application/ld+json">
          {JSON.stringify(localBusinessSchema)}
        </script>
        {children}
      </body>
    </html>
  );
}
