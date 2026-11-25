# SEO Final Audit Report: ideaxcorp.com

Date: 25 November 2026
Source audit: `issues_overview_report.csv` (Screaming Frog; 20 finding types: 3 issues, 10 warnings, 7 opportunities)
Scope: the static website in `ribbit.dk/` (built to `ribbit.dk/dist/` with `npm run build`)

## Status at a glance

**Everything below is fixed in the source and the build, and tested locally. Nothing has been deployed.** The live site at https://ideaxcorp.com still shows the original findings until the steps in [Deployment](#deployment-needed-for-the-fixes-to-reach-ideaxcorpcom) are done.

| # | Finding (CSV) | Count | Result |
|---|---|---|---|
| 1 | Response Codes: Internal Client Error (4xx) | 11 | **Fixed**: 0 broken internal links; 301 redirects prepared |
| 2 | Canonicals: Canonicalised | 2 | **Fixed**: the duplicate `/index.html` URLs are no longer linked; 301 redirects prepared |
| 3 | Canonicals: Non-Indexable Canonical | 1 | **Fixed**: same cause as #2 |
| 4 | Directives: Noindex | 2 | **Intentional**: the privacy policy, at one URL after the fix |
| 5 | Page Titles: Over 60 Characters | 2 | **Fixed** |
| 6 | Page Titles: Over 561 Pixels | 1 | **Fixed** |
| 7 | Meta Description: Over 155 Characters | 2 | **Fixed** |
| 8 | Meta Description: Over 985 Pixels | 3 | **Fixed** |
| 9 | H1: Non-Sequential | 1 | **Fixed** |
| 10 | H2: Multiple | 6 | **No change**: valid structure |
| 11 | H2: Duplicate | 4 | **No change**: valid structure |
| 12 | Images: Over 100 kB | 8 | **Improved**: 8 → 3, each now smaller |
| 13 | Images: Missing Alt Text | 24 | **Reviewed**: 21 remain, all decorative and correctly empty |
| 14 | Images: Missing Image Title | 54 | **No change**: titles add no value here |
| 15 | Security: Bad Content Type | 22 | **Fixed in server config** (needs upload) |
| 16 | Security: Missing HSTS Header | 110 | **Fixed in server config** (needs upload) |
| 17 | Security: Missing Secure Referrer-Policy | 110 | **Fixed in server config** (needs upload) |
| 18 | Security: Missing X-Content-Type-Options | 110 | **Fixed in server config** (needs upload) |
| 19 | Security: Missing X-Frame-Options | 9 | **Fixed in server config** (needs upload) |
| 20 | Links: Pages With High External Outlinks | 3 | **Reviewed**: all links legitimate, none removed |

## Hosting environment (verified)

- **https://ideaxcorp.com** is served by **Hostinger** (`server: LiteSpeed`, `platform: hostinger`, `panel: hpanel`). It runs an older copy of this site, uploaded separately. Server rules for it go in **`.htaccess`**.
- **https://ideaxcorp-3089b.web.app** is **Firebase Hosting**. It is deployed from `dist/` by `firebase deploy`, and its server rules live in **`firebase.json`**.
- Firestore (the blog database) and the `/admin/` blog manager are used by both copies.

## How the findings were reproduced

I re-crawled the live site with a crawler written for this audit (`scratchpad/seo/crawl.mjs`). It found 147 URLs and 9 HTML pages. Every count in the CSV was reproduced:
- 11 × 404;
- 2 canonicalised pages and 1 non-indexable canonical;
- 2 noindex pages;
- 22 scripts sent as `application/x-javascript`;
- 24 images with empty alt;
- the same titles, descriptions and headings.

That crawl then served as the "before" baseline. The fixed build was crawled the same way from a local server (`localhost:8082`, gzip on, like the host).

---

## 1. Broken links and response codes

**Cause.** The 11 URLs that return 404 are blog addresses from the old WordPress site. They no longer exist on ideaxcorp.com, but the new site's blog cards still linked to them.

| Broken URL (404) | Linked from | Fix |
|---|---|---|
| `/chatgpt-astra-what-is-gpt-6-astra/` | `/`, `/blog/` | 301 → `/blog/post/?s=chatgpt-astra-what-is-gpt-6-astra` |
| `/microsoft-clarity-ai-citations-branded-nonbranded/` | `/`, `/blog/` | 301 → `/blog/post/?s=…` (same slug) |
| `/aeo-geo-seo-for-businesses/` | `/`, `/services/`, `/blog/` | 301 → `/blog/post/?s=…` |
| `/google-business-profile-local-customers/` | `/services/`, `/blog/` | 301 → `/blog/post/?s=…` |
| `/generative-engine-optimization-guide/` | `/blog/` | 301 → `/blog/post/?s=…` |
| `/ai-search-optimization-how-to-rank-in-chatgpt/` | `/blog/` | 301 → `/blog/post/?s=…` |
| `/why-customers-dont-trust-your-business/` | `/blog/` | 301 → `/blog/post/?s=…` |
| `/marketing-trends-2026the-future-is-already-here/` | `/blog/` | 301 → `/blog/post/?s=…` |
| `/seo-alogitham-update-2026/` | `/blog/` | 301 → `/blog/post/?s=…` |
| `/ranking-without-strategy-is-pointless/` | `/blog/` (featured article) | 301 → `/blog/post/?s=…` |
| `/blog-grid/` | `/blog/` (empty-state button) | 301 → `/blog/` |

**Links corrected at the source:**
- The static links in `blog/index.html` and `services/index.html` now point to the on-site article page or `/blog/`.
- The blog cards drawn from the database (`ideaxcorp-blogcms.js`) now link to their on-site article page whenever the stored link is an old ideaxcorp.com address.
- None of these redirect to the homepage. Each old article goes to the same article on the new blog, and `/blog-grid/` goes to `/blog/`.

**Content still missing.** Those articles' full text no longer exists anywhere. The CMS holds only their title, date, category and summary. Their pages therefore show the summary and are **noindex** until the text is added in `/admin/` (see [Remaining](#remaining-warnings-and-recommendations)).

**Test evidence:**
- The crawl of the build found **0 internal 4xx** (before: 11).
- In a rendered check, every blog and home card links to `/blog/post/?s=…`, and none to a dead ideaxcorp.com address.
- `/blog/post/?s=chatgpt-astra-what-is-gpt-6-astra` renders with its title, H1, canonical address and BlogPosting structured data.

## 2. Canonicals and indexing

**Cause.** The footer and navbar linked to `index.html` and `privacy-policy/index.html` as relative links. Crawlers saw `/index.html`, which canonicalises to `/`. They also saw `/privacy-policy/index.html`, which canonicalises to `/privacy-policy/`, and that page is noindex, so the canonical was non-indexable.

**Fixes:**
- **Every link is now an absolute canonical address:** `/` and `/privacy-policy/`, in all 12 HTML files.
- **301 redirects** for the two `/index.html` addresses. In `.htaccess` they fire only when the file is requested by name, so a folder's own index page never redirects. They're also in `firebase.json`.
- **Article pages** (`/blog/post/?s=<slug>`) used to share one static canonical, `/blog/post/`, for every article. Each now sets its own canonical, `og:url` and BlogPosting `url`.
- **Article robots tags:** a missing article is noindex, and so is an article without its text.
- **One host:** `www.ideaxcorp.com` currently serves a full duplicate of the site with HTTP 200. `.htaccess` now 301-redirects it to `https://ideaxcorp.com`. HTTPS redirection is kept.

**Intentional noindex, preserved:**
- `/privacy-policy/` (`noindex, follow`, as before);
- `/process/` (noindex and not linked anywhere);
- `/index595d.html` (the site's internal page-transition copy of Home);
- `/404.html`;
- `/admin/` (meta tag, `X-Robots-Tag` header, and `Disallow` in robots.txt).

**robots.txt** is correct: everything is allowed except `/admin/`, and it points to the sitemap.

**sitemap.xml:**
- It lists the 6 indexable pages, every one returning 200.
- `npm run build` now also adds each published article that has its full text, read from Firestore with its date as `lastmod`.
- None qualifies today (9 published, all summary-only), so none was added. That's correct.

**Test evidence:**
- The crawl of the build has no `/index.html` URLs.
- Canonicals are absolute. They show as "canonicalised" there only because the crawl ran on `localhost` while the canonicals name ideaxcorp.com.
- The article page sets the canonical above, and its robots tag says `noindex, follow` while it has only a summary.

## 3. On-page SEO

Widths are measured in Chrome: Arial 20 px for titles and Arial 14 px for descriptions. These match Screaming Frog's flags; for example Home's 918 px description wasn't flagged, while About's 993 px one was.

| Page | Before | After |
|---|---|---|
| `/` title | Ideaxcorp \| Creative Digital Marketing Agency in Dubai & Kerala (63 ch, 567 px) | Ideaxcorp \| Digital Marketing Agency in Dubai & Kerala (54 ch, 487 px) |
| `/services/` title | Digital Marketing Services \| Branding, Websites, SEO & Ads \| Ideaxcorp (70 ch, 637 px) | Digital Marketing Services in Dubai & Kerala \| Ideaxcorp (56 ch, 497 px) |
| `/services/` description | 157 ch, 1037 px | Branding, websites, social media, paid ads, SEO, Google Business Profile and e-commerce services from Ideaxcorp in Dubai and Kerala. (132 ch, 851 px) |
| `/about/` description | 155 ch, 993 px | Ideaxcorp is a data-focused digital marketing and e-commerce agency in Dubai and Thrissur, helping brands across the UAE, GCC and Kerala grow. (142 ch, 921 px) |
| `/contact/` description | 159 ch, 1037 px | Contact Ideaxcorp in Al Ras, Dubai or Thrissur, Kerala. Call or WhatsApp +971 56 744 8005, or email ideaxcorp@gmail.com. Mon to Sat, 9 AM to 6 PM. (146 ch, 942 px) |

- **Where the changes go:** each change is applied to the `<title>` or description, plus the matching `og:`, `twitter:` and JSON-LD `WebPage` values.
- **Wording:** the facts are kept and nothing is keyword-stuffed.
- **Uniqueness:** titles and descriptions remain unique across pages.

**H1 non-sequential.** The intro screen's "Hi, we are" was an `<h5>` placed before the page's `<h1>`. It's now `<p class="intro-hi">`, with the same CSS (`global9eda.css`: the `h5` rules now also cover `.intro-hi`). The intro script (`min9eda.js`) finds it by class instead of tag name.
- **Evidence:** its computed style is identical before and after: Space Grotesk 24 px (19 px on phones), weight 600, the same line height and letter spacing, the same position, and the same 3 animated words. The rebuilt crawl has `h1@0` on every page.

**H2 multiple and duplicate: no change, on purpose.**
- The pages use one H1 and an H2 per content section, which is valid structure.
- The duplicate H2s are the shared closing section ("Let's create what's next.") and similar shared blocks across pages. They're semantically correct, so I haven't reworded them.

**Open Graph and structured data.** Every page has `og:title`, `og:description`, `og:url`, `og:image` (1200×630, with alt) and Twitter cards. JSON-LD is valid:
- Organization, WebSite and WebPage on every page;
- BreadcrumbList on inner pages;
- Blog on `/blog/`;
- ContactPage and ProfessionalService on `/contact/`;
- BlogPosting on article pages.

## 4. Images

Each image was compressed at its existing size, keeping the original as a backup, and checked against the original by PSNR (higher means closer; 38 dB is effectively invisible). All results are 38.8 dB or higher, and close-up side-by-side comparisons look identical.

| Image | Before | After | Note |
|---|---|---|---|
| `site/blog/chatgpt-astra-hd.webp` | 201 KB | 113 KB | q76, 39.1 dB |
| `site/team/team-group.jpg` → `.webp` | 201 KB | 88 KB | q76, 39.0 dB; reference updated |
| `site/blog/clarity-ai-citations-hd.webp` | 130 KB | 92 KB | q76, 40.0 dB |
| `site/blog/aeo-geo-seo-hd.webp` | 123 KB | 80 KB | q76, 39.6 dB |
| `site/blog/google-business-profile.webp` | 119 KB | 98 KB | q76, 39.1 dB |
| `site/diarys-brand-identity.webp` | 127 KB | 102 KB | q80, 38.8 dB |
| `site/smm-portfolio-1.webp` | 392 KB | 270 KB | q90 (fine-detail collage; lower quality fell below 38 dB) |
| `site/smm-portfolio-2.webp` | 506 KB | 263 KB | q90 |
| `intro/*.png` (5 files) → `.webp` | 380 KB | 149 KB | transparency kept; done in the earlier performance pass |

- **Still over 100 KB:** 3 images, the two collages and one at 102 KB. All three are in the portfolio pop-ups (`<template>`), so they download only when a visitor opens a project.
- **Responsive images:** the service illustrations already use `srcset` (480 / 720 / 1080 w). Below-the-fold images use `loading="lazy"`, and hero images aren't lazy-loaded.
- **Layout shift:** every `<img>` has `width` and `height`. CLS measured 0.

**Alt text (24 flagged → 21, all decorative; no change needed):**
- the 5 intro characters and 4 hero character frames;
- the 5 footer illustrations;
- the blurred background copies of the blog thumbnails (`aria-hidden`);
- the 7 service illustrations. On `/services/` each appears twice: the visible copy has descriptive alt ("Illustration: a brand designer sketching a logo…"), and the second, decorative copy correctly has `alt=""`.

**Title attributes (54): no change.** A title only shows on mouse hover, so it would repeat the alt text without helping anyone.

## 5. Security headers and server configuration

**Bad content type (22).** All 22 are `.js` files served by Hostinger as `application/x-javascript`. `.htaccess` sets `text/javascript`, plus correct types for CSS, JSON, XML, WebP, AVIF, SVG, WOFF2 and MP4, all with UTF-8. This comes before `nosniff`, so nothing gets blocked. (Firebase already sends `text/javascript`.)

**Headers.** `.htaccess` (for Hostinger) and `firebase.json` (for Firebase) set:

| Header | Value | Why it's safe |
|---|---|---|
| Strict-Transport-Security | `max-age=31536000` (Hostinger) | HTTPS verified on `ideaxcorp.com` and `www`; HTTP already 301s to HTTPS. Subdomains and preload not included, on purpose. Firebase already sends its own HSTS. |
| X-Content-Type-Options | `nosniff` | content types corrected first |
| Referrer-Policy | `strict-origin-when-cross-origin` | site-wide; `/admin/` keeps `same-origin` on Firebase |
| X-Frame-Options | `SAMEORIGIN` (`/admin/`: `DENY`) | The site embeds Google Maps, which isn't affected: this header only stops others framing the site. |

- **Untouched:** the host's existing `Content-Security-Policy: upgrade-insecure-requests`. No Content-Security-Policy was added, because the site loads scripts and fonts from cdnjs, Google Fonts, gstatic (Firebase) and Firestore, so a strict policy needs its own testing.
- **Also in `.htaccess`:**
  - `Options -Indexes`;
  - `ErrorDocument 404 /404.html` (its links are now absolute, so it works at any depth);
  - cache headers: HTML is always rechecked, while versioned assets and images are cached for 30 days;
  - `admin/.htaccess` adds `X-Robots-Tag: noindex, nofollow` and no caching.
- **The build:** `npm run build` now copies both `.htaccess` files into `dist/`. Firebase ignores them.

**Not tested before deployment.** No LiteSpeed server is available locally to test `.htaccess`. The rules are standard mod_rewrite, mod_headers and mod_mime, which LiteSpeed supports. Firebase's local emulator ignores `headers` and `redirects`, so the new `firebase.json` rules are checked only for structure. Both must be verified live with the commands in [Deployment](#deployment-needed-for-the-fixes-to-reach-ideaxcorpcom). The headers already on Firebase (`Cache-Control`, the `/admin/` headers) were confirmed working on the live site.

## 6. External links

The 3 flagged pages (`/`, `/portfolio/`, `/contact/`) have 12–15 external links each. All are legitimate:
- the Instagram, Facebook and LinkedIn profiles;
- WhatsApp;
- Google Maps directions to the two offices;
- the live websites of portfolio clients (diarystourism.com, idealpackstore.com, idealpackuae.com, nawaayurveda.ae, kyokushinkarateuae.com, ideaxacademy.com).

All return 200, except LinkedIn, which returns 403 to every automated client (normal for LinkedIn; it works in browsers). None was removed.

## 7. Additional verification

**Lighthouse (mobile, built site served with gzip):**

| Page | SEO | Accessibility | Best Practices |
|---|---|---|---|
| `/` | 100 | 100 | 100 |
| `/services/` | 100 | 100 | 100 |
| `/about/` | 100 | 96 | 100 |
| `/portfolio/` | 100 | 100 | 100 |
| `/blog/` | 100 | 100 | 100 |
| `/contact/` | 100 | 100 (was 100 with one failing audit; now fixed) | 100 |
| `/privacy-policy/` | 69 | 100 | 100 |
| `/blog/post/?s=…` (summary only) | 69 | 100 | 100 |

- **SEO 69:** only the "is crawlable" audit fails, because those pages are intentionally noindex. Every indexable page scores 100.
- **Contact:** an `<article>` carried `role="tabpanel"`, which ARIA doesn't allow. It's now a `<div>`; nothing styles or queries that tag. The UAE/India office tabs still switch correctly at 1440 px and 390 px.
- **About accessibility 96:** the inactive steps of the "Our approach" list are dimmed to #BDBDBD until each is reached while scrolling. That's a design state, so I left it (see Remaining).

**Performance and Core Web Vitals** (Home, from the mobile performance pass in this session; lab data):
- **Score:** 43 → about 55 in Lighthouse (52–58 across runs).
- **LCP:** 26.2 s → about 5.5 s simulated; 0.84 s observed on a fast connection.
- **CLS:** 0.
- **Blocking time:** 490–690 ms.

**Functional regression tests** (headless Chrome, 1440 px and 390 px; no console errors):
- page transitions on every route, in both directions;
- hero characters animate and hand over to the walking guide;
- the intro plays as before;
- the blog admin, all 24 steps: sign-in, add, image upload, draft, publish, edit, preview, search, filters, delete;
- create → publish → visible on `/blog`, Home and the article page → delete → gone everywhere;
- the contact office tabs;
- calls to action, checked from the crawl: `/contact/` returns 200 and is linked from all 10 crawled pages; the WhatsApp link (`wa.me/971567448005`) returns 200 and is on all 10.
- the contact forms (Home and `/contact/`, 1440 px and 390 px): an empty submit highlights the required fields (name, phone, email, message, and topic on `/contact/`), shows "Please check the highlighted fields." and stays on the page. A complete message was not submitted, since that would start a real email.
- **Note on sending:** the forms have no Web3Forms key (`data-key=""`), so a valid submit opens the visitor's own email app with the message filled in, rather than sending from the page. Adding a Web3Forms access key to `data-key` makes them send directly.

**Not tested here:**
- Real-user Core Web Vitals. These need Search Console or CrUX field data after deployment.
- A Screaming Frog re-crawl of the live site. The CSV findings will clear only after deployment; my own crawler was used instead.

## Intentional exceptions

| Item | Reason |
|---|---|
| noindex on `/privacy-policy/`, `/process/`, `/index595d.html`, `/404.html`, `/admin/` | Utility or private pages; kept as set |
| noindex on articles without their full text | Thin pages (summary only); indexable as soon as the text is written in the admin |
| 21 decorative images with `alt=""` | Correct accessibility practice |
| No `title` attributes added | No user value |
| Multiple or duplicate H2s | Valid heading structure; shared closing section |
| 3 portfolio images over 100 KB | Fine-detail collages, loaded only in pop-ups |
| About step text #BDBDBD | Scroll-driven design state |

## Remaining warnings and recommendations

1. **Write the 10 blog articles' full text** in `/admin/`, or remove articles you don't want. Until then:
   - their old addresses redirect to summary pages marked noindex;
   - nothing appears in the sitemap or in search for them.
2. **Import the featured article.** "Ranking Without Strategy Is Pointless" was added to the admin's import list. On the admin dashboard, click **Import 1 article** after deploying. Until then, `/blog/post/?s=ranking-without-strategy-is-pointless` shows "Article not found" (noindex).
3. **Article pages need JavaScript for their SEO tags.** Each article's title, H1, canonical and robots tag are filled in by JavaScript. Google renders this, but non-JavaScript crawlers see a generic "Article | Ideaxcorp" page. Screaming Frog needs JavaScript rendering mode to audit articles. A pre-rendered page per article would remove this dependency.
4. **The `web.app` copy** is a full duplicate of the site. Its canonicals point to ideaxcorp.com, which is acceptable. To keep it out of search entirely, add `X-Robots-Tag: noindex` for that host only.
5. **Optional:**
   - darken the dimmed About steps (for example to #8A8A8A) for AA contrast;
   - add a tested Content-Security-Policy.

## Deployment (needed for the fixes to reach ideaxcorp.com)

**These are deployment blockers. Nothing has been uploaded or deployed.**

1. Build: `cd ribbit.dk && npm run build`.
2. **Hostinger (ideaxcorp.com):** upload the contents of `ribbit.dk/dist/` to `public_html`, including `dist/.htaccess` and `dist/admin/.htaccess`.
   - Before uploading, back up the current `public_html/.htaccess`.
   - The new file replaces it, and already includes the HTTPS redirect.
3. **Firebase (web.app):** `firebase deploy --only hosting`.
4. **Admin:** click **Import 1 article** on the admin dashboard.
5. **Verify on the live site:**
   - `curl -sI https://ideaxcorp.com/about/` should show `strict-transport-security`, `x-content-type-options: nosniff`, `referrer-policy`, `x-frame-options`.
   - `curl -sI "https://ideaxcorp.com/Assets/Js/min9eda.js"` should show `content-type: text/javascript`.
   - `curl -sI https://www.ideaxcorp.com/` and `https://ideaxcorp.com/index.html` should each return 301 to the canonical address.
   - `curl -sI https://ideaxcorp.com/chatgpt-astra-what-is-gpt-6-astra/` should return 301 to `/blog/post/?s=…`.
   - Open every page and the admin in a browser and check the console is clean.
   - Re-crawl with Screaming Frog, with JavaScript rendering on, and compare with this report.

## Files changed

Website (`ribbit.dk/`):
- **HTML:**
  - `index.html`, `index595d.html`: home title, intro heading, links;
  - `services/`, `about/`, `contact/`: meta, links; `contact/` also has the tab panel `<div>`; `about/` uses `team-group.webp`;
  - `blog/index.html`: featured and empty-state links;
  - `blog/post/index.html`: static canonical removed;
  - `portfolio/`, `privacy-policy/`, `process/`, `giItT1WQy@!-/`: canonical links;
  - `404.html`: absolute links.
- **CSS / JS:**
  - `Assets/Css/global9eda.css`, `Assets/Js/min9eda.js`: intro heading;
  - `Assets/Js/ideaxcorp-blogcms.js`: article links, canonical, robots;
  - `admin/admin.js`: article links, editor note;
  - `admin/legacy-posts.js`: featured article added;
  - from the earlier performance pass: `ideaxcorp-herox.js/.css`, `ideaxcorp-journey.js/.css`, `ideaxcorp-transition.js`, `ideaxcorp-chars.js`, `ideaxcorp-motion.css`.
- **Images:** 7 recompressed in place; new `team/team-group.webp` and `intro/*.webp`.
- **Server and build:**
  - new: `.htaccess`, `admin/.htaccess`;
  - updated: `firebase.json` (security headers, 13 redirects), `build.mjs` (copies `.htaccess`, adds articles to the sitemap), `.gitignore`.

Audit tooling (scratchpad, not part of the site): `seo/crawl.mjs`, `seo/analyse.mjs`, `seo/measure.mjs`, `seo/introshot.mjs`, `seo/article.mjs`, `seo/tabs.mjs`. The crawl results are `seo/live-before.json` / `.txt` (live site) and `seo/local-after.json` / `.txt` (fixed build).
