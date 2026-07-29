import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { directionsUrl, siteConfig } from "@/config/site";

export default function Footer() {
  return (
    <footer className="bg-brand-secondary text-white">
      <div className="site-container py-10">
        <div className="grid gap-9 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start">
            <Image
              src={siteConfig.assets.logo}
              alt={`${siteConfig.businessName} logo`}
              width={160}
              height={160}
              className="h-32 w-32 object-contain lg:h-40 lg:w-40"
            />
          </div>

          <div>
            <h2 className="mb-3 text-xl">Visit Us</h2>
            <div className="mb-3 flex items-start">
              <MapPin size={17} className="mr-2 mt-0.5 shrink-0" />
              <address className="not-italic leading-6">
                {siteConfig.contact.addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </div>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center text-brand-accent transition-colors hover:text-white"
            >
              Get Directions <ArrowRight size={14} className="ml-1" />
            </a>
          </div>

          <div>
            <h2 className="mb-3 text-xl">Restaurant Hours</h2>
            <ul className="space-y-2">
              {siteConfig.hours.map(({ days, times }) => (
                <li key={days}>
                  <span className="block font-semibold">{days}</span>
                  <span>{times}</span>
                </li>
              ))}
            </ul>
            {siteConfig.ordering.enabled && siteConfig.ordering.url ? (
              <a
                href={siteConfig.ordering.url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex rounded-full bg-brand-surface px-4 py-2 font-semibold text-brand-secondary transition-opacity hover:opacity-90"
              >
                {siteConfig.ordering.label}
              </a>
            ) : null}
          </div>

          <div>
            <h2 className="mb-3 text-xl">Contact Us</h2>
            <a
              href={`mailto:${siteConfig.contact.email}`}
              className="mb-3 flex items-center transition-colors hover:text-brand-accent"
            >
              <Mail size={17} className="mr-2 shrink-0" />
              {siteConfig.contact.email}
            </a>
            <a
              href={`tel:${siteConfig.contact.phoneHref}`}
              className="flex items-center transition-colors hover:text-brand-accent"
            >
              <Phone size={17} className="mr-2 shrink-0" />
              {siteConfig.contact.phoneDisplay}
            </a>
            <Link
              href="/contact"
              className="mt-4 inline-flex text-brand-accent transition-colors hover:text-white"
            >
              Send a message <ArrowRight size={14} className="ml-1 mt-1" />
            </Link>
          </div>
        </div>

        <div className="mt-9 border-t border-white/20 pt-5 text-center text-sm text-brand-surface">
          © {new Date().getFullYear()} {siteConfig.businessName}. All rights
          reserved.
        </div>
      </div>
    </footer>
  );
}
