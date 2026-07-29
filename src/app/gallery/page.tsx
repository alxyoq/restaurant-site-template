import type { Metadata } from "next";

import Layout from "@/components/layout/Layout";
import { galleryContent } from "@/content/gallery";
import { createPageMetadata } from "@/lib/metadata";

import GalleryClient from "./GalleryClient";

export const metadata: Metadata = createPageMetadata(
  "Gallery",
  "Explore restaurant food, atmosphere, events, and behind-the-scenes photos.",
  "/gallery",
);

export default function GalleryPage() {
  return (
    <Layout>
      <div className="bg-brand-surface py-14 md:py-16">
        <div className="site-container">
          <h1 className="page-heading">{galleryContent.title}</h1>
          <p className="page-intro mb-12">{galleryContent.intro}</p>
          <GalleryClient />
        </div>
      </div>
    </Layout>
  );
}
