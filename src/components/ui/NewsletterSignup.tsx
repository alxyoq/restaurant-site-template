import { siteConfig } from "@/config/site";

export default function NewsletterSignup() {
  if (!siteConfig.newsletter.enabled) {
    return null;
  }

  return (
    <section className="bg-brand-surface py-14">
      <div className="site-container text-center">
        <h2 className="mb-4 text-3xl text-brand-primary md:text-4xl">
          {siteConfig.newsletter.title}
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-lg">
          {siteConfig.newsletter.description}
        </p>

        <form
          name="newsletter"
          method="POST"
          action="/thank-you"
          data-netlify="true"
          data-netlify-honeypot="bot-field"
          className="mx-auto max-w-2xl"
        >
          <input type="hidden" name="form-name" value="newsletter" />
          <p className="hidden">
            <label>
              Do not fill this out:
              <input name="bot-field" />
            </label>
          </p>
          <div className="mb-4 flex flex-col gap-4 md:flex-row">
            <label htmlFor="newsletter-name" className="sr-only">
              Name
            </label>
            <input
              type="text"
              id="newsletter-name"
              name="name"
              placeholder="Name"
              className="min-h-11 flex-1 rounded-md border border-gray-300 bg-white px-4 py-2"
              required
            />
            <label htmlFor="newsletter-email" className="sr-only">
              Email
            </label>
            <input
              type="email"
              id="newsletter-email"
              name="email"
              placeholder="Email"
              className="min-h-11 flex-1 rounded-md border border-gray-300 bg-white px-4 py-2"
              required
            />
          </div>

          <button type="submit" className="btn-outline mx-auto w-32">
            Join
          </button>
        </form>
      </div>
    </section>
  );
}
