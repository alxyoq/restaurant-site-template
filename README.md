# Restaurant Site Template

A reusable restaurant website based on the layout and interaction patterns of
Woodbury Station Cafe, rebuilt so each new business can be configured from a
small set of files.

The template includes:

- Responsive shrinking header and mobile navigation
- Home, menu, catering, gallery, reviews, contact, and thank-you pages
- Data-driven menu categories and items
- Configurable gallery with a keyboard-accessible lightbox
- Centralized business details, hours, links, SEO, and social metadata
- Centralized brand colors
- Working Netlify contact and newsletter forms
- Placeholder assets that are obvious and safe to replace
- Netlify deployment configuration

## Create a New Client Site

After this repository is marked as a GitHub template:

1. Select **Use this template** on GitHub.
2. Choose **Create a new repository**.
3. Clone the new repository.
4. Run `npm install`.
5. Complete the replacement checklist below.
6. Run `npm run check` and `npm run build`.
7. Deploy the new repository to Netlify.

## Replacement Checklist

| File or folder | Replace |
|---|---|
| `src/config/site.ts` | Business name, wordmark, contact details, address, hours, ordering, review, and social links |
| `src/styles/theme.css` | Primary, secondary, accent, surface, and text colors |
| `src/content/home.ts` | Homepage headings, paragraphs, calls to action, and image paths |
| `src/content/menu.ts` | Menu categories, items, descriptions, prices, and dietary tags |
| `src/content/reviews.ts` | Verified public reviews and source links |
| `src/content/gallery.ts` | Gallery images, alt text, and dimensions |
| `src/content/catering.ts` | Catering and events copy and photos |
| `public/images/brand/` | Logo, favicon, and social sharing image |
| `public/images/site/` | Hero, food, interior, exterior, event, and gallery photos |

Search for `REPLACE` before launching. Every included SVG is a labeled
placeholder and should be replaced with real client photography or artwork.

## Business Configuration

Most business-wide information lives in `src/config/site.ts`. Optional links
are hidden safely until configured:

```ts
ordering: {
  enabled: true,
  label: "Order Online",
  url: "https://the-ordering-provider.example/restaurant",
},
social: {
  instagramUrl: "https://www.instagram.com/example/",
  facebookUrl: "https://www.facebook.com/example/",
},
```

Set `siteUrl` to the final production domain so canonical links and social
metadata point to the correct website.

## Brand Colors

Change the six values at the top of `src/styles/theme.css`:

```css
--color-primary: #a8663f;
--color-primary-dark: #874d2e;
--color-secondary: #536a57;
--color-accent: #ddb66f;
--color-surface: #fff8ee;
--color-ink: #29231f;
```

These variables control the header, buttons, headings, background, footer, and
interactive states throughout the site.

## Photos and Image Sizes

Keeping the existing filenames is the fastest workflow. If filenames change,
update the matching path in `src/content` or `src/config/site.ts`.

Recommended minimum sizes:

| Asset | Recommended size |
|---|---|
| Hero | 1600 × 900 |
| Homepage sections | 1200 × 800 |
| Gallery | 1200 px on the longest edge |
| Logo | SVG or transparent PNG, at least 512 × 512 |
| Social card | 1200 × 630 PNG or JPG |
| Favicon | SVG or 512 × 512 PNG |

Always write specific alt text describing the final photo.

## Menu Editing

Each menu category in `src/content/menu.ts` follows this shape:

```ts
{
  title: "Lunch",
  description: "Optional category note.",
  items: [
    {
      name: "House Burger",
      price: "$15",
      description: "Patty, toppings, bun, and included side.",
      tags: ["Gluten-aware"],
    },
  ],
}
```

Categories automatically become navigation buttons and anchored sections. Add,
remove, or reorder categories without editing the page component.

## Netlify Forms

The contact and newsletter forms use Netlify Forms and redirect to
`/thank-you` after submission.

After the first Netlify deploy:

1. Open **Forms** in the Netlify dashboard.
2. Confirm `contact` and `newsletter` were detected.
3. Submit a test entry through the deployed site.
4. Configure email notifications or integrations as needed.

Form handling only activates on Netlify; local submissions do not enter the
Netlify dashboard.

## Commands

```bash
npm install
npm run dev
npm run check
npm run build
```

Open [http://localhost:3000](http://localhost:3000) during development.

## Launch Check

Before publishing a client site:

- Search for `REPLACE`, `Restaurant Name`, `example.com`, and `555-0123`.
- Verify every menu item and price against the client’s current menu.
- Use only real, permission-safe reviews.
- Test phone, email, directions, social, ordering, and review links.
- Test contact and newsletter submissions on the deployed Netlify site.
- Check every page at mobile and desktop widths.
- Replace the social card and confirm its preview.
- Run `npm run check` and `npm run build`.
