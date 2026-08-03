import { Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";

import Layout from "@/components/layout/Layout";
import previewPolicy from "@/config/preview-policy.json";
import { directionsUrl, mapEmbedUrl, siteConfig } from "@/config/site";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata(
  "Contact",
  previewPolicy.contactFormEnabled
    ? "Find restaurant hours, directions, phone and email details, or send a message."
    : "Find verified restaurant hours, directions, phone, and email details.",
  "/contact",
);

const inputClasses =
  "w-full rounded-md border border-gray-300 bg-white px-4 py-2.5";

export default function ContactPage() {
  return (
    <Layout>
      <div className="bg-brand-surface py-14 md:py-16">
        <div className="site-container">
          <h1 className="page-heading">Contact Us</h1>
          <p className="page-intro">
            {previewPolicy.contactFormEnabled
              ? "Have a question, catering request, or comment? Send a message or use the contact details below."
              : "Use the verified location and contact details below."}
          </p>

          <div className="my-12 grid gap-10 lg:grid-cols-2">
            <div>
              <div className="content-card p-7 md:p-8">
                <h2 className="mb-7 text-3xl text-brand-secondary">
                  Contact Information
                </h2>
                <ul className="space-y-6">
                  <li className="flex items-start">
                    <MapPin className="mr-4 mt-1 shrink-0 text-brand-primary" />
                    <div>
                      <h3 className="mb-1 font-body font-semibold">Address</h3>
                      <address className="not-italic leading-6">
                        {siteConfig.contact.addressLines.map((line) => (
                          <span key={line} className="block">
                            {line}
                          </span>
                        ))}
                      </address>
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-sm text-brand-primary hover:text-brand-secondary"
                      >
                        Get Directions →
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Phone className="mr-4 mt-1 shrink-0 text-brand-primary" />
                    <div>
                      <h3 className="mb-1 font-body font-semibold">Phone</h3>
                      <a
                        href={`tel:${siteConfig.contact.phoneHref}`}
                        className="hover:text-brand-primary"
                      >
                        {siteConfig.contact.phoneDisplay}
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Mail className="mr-4 mt-1 shrink-0 text-brand-primary" />
                    <div>
                      <h3 className="mb-1 font-body font-semibold">Email</h3>
                      <a
                        href={`mailto:${siteConfig.contact.email}`}
                        className="hover:text-brand-primary"
                      >
                        {siteConfig.contact.email}
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Clock className="mr-4 mt-1 shrink-0 text-brand-primary" />
                    <div>
                      <h3 className="mb-2 font-body font-semibold">Hours</h3>
                      <ul className="space-y-2">
                        {siteConfig.hours.map(({ days, times }) => (
                          <li key={days}>
                            <span className="font-semibold">{days}:</span>{" "}
                            {times}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="mt-8 overflow-hidden rounded-2xl shadow-soft">
                <Image
                  src="/images/site/exterior.svg"
                  alt="Replace with a photo of the restaurant exterior"
                  width={1200}
                  height={800}
                  className="h-auto w-full object-cover"
                />
              </div>
            </div>

            <div className="content-card p-7 md:p-8">
              {previewPolicy.contactFormEnabled ? (
                <>
                  <h2 className="mb-7 text-3xl text-brand-secondary">
                    Send Us a Message
                  </h2>
                  <form
                    name="contact"
                    method="POST"
                    action="/thank-you"
                    data-netlify="true"
                    data-netlify-honeypot="bot-field"
                    className="space-y-6"
                  >
                    <input type="hidden" name="form-name" value="contact" />
                    <p className="hidden">
                      <label>
                        Do not fill this out:
                        <input name="bot-field" />
                      </label>
                    </p>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="first-name" className="mb-2 block">
                          First Name <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          id="first-name"
                          name="first-name"
                          required
                          autoComplete="given-name"
                          className={inputClasses}
                        />
                      </div>
                      <div>
                        <label htmlFor="last-name" className="mb-2 block">
                          Last Name <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          id="last-name"
                          name="last-name"
                          required
                          autoComplete="family-name"
                          className={inputClasses}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="mb-2 block">
                        Email <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        autoComplete="email"
                        className={inputClasses}
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="mb-2 block">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        autoComplete="tel"
                        className={inputClasses}
                      />
                    </div>

                    <div>
                      <label htmlFor="subject" className="mb-2 block">
                        Subject <span className="text-red-600">*</span>
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        required
                        className={inputClasses}
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Select a subject
                        </option>
                        <option value="general">General Inquiry</option>
                        <option value="reservation">Reservation</option>
                        <option value="catering">Catering</option>
                        <option value="feedback">Feedback</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="message" className="mb-2 block">
                        Message <span className="text-red-600">*</span>
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={6}
                        required
                        className={inputClasses}
                      />
                    </div>

                    <button type="submit" className="btn-primary w-full">
                      <Send size={18} className="mr-2" />
                      Send Message
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex h-full min-h-72 flex-col justify-center text-center">
                  <h2 className="text-3xl text-brand-secondary">
                    Preview Contact
                  </h2>
                  <p className="mx-auto mt-5 max-w-md leading-7 text-gray-600">
                    This draft does not collect form submissions. Use the
                    verified contact details shown on this page.
                  </p>
                </div>
              )}
            </div>
          </div>

          <section id="location" className="scroll-mt-24">
            <h2 className="mb-8 text-center text-4xl text-brand-primary">
              Find Us
            </h2>
            <div className="h-[420px] overflow-hidden rounded-2xl bg-white shadow-soft">
              <iframe
                title={`Map to ${siteConfig.businessName}`}
                src={mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
