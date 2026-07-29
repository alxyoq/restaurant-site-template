import type { Metadata } from "next";
import Link from "next/link";

import Layout from "@/components/layout/Layout";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata(
  "Thank You",
  "Your message has been received.",
  "/thank-you",
);

export default function ThankYouPage() {
  return (
    <Layout showNewsletter={false}>
      <div className="bg-brand-surface px-4 py-24 text-center">
        <div className="content-card mx-auto max-w-2xl p-10 md:p-14">
          <h1 className="text-4xl text-brand-primary">Thank You</h1>
          <p className="mx-auto my-5 max-w-lg leading-7 text-gray-700">
            Your submission was received. The restaurant will follow up using
            the contact information you provided.
          </p>
          <Link href="/" className="btn-primary">
            Return Home
          </Link>
        </div>
      </div>
    </Layout>
  );
}
