---
description: Audit or build UI with premium aesthetics, smooth transitions, modern cards and polished visual hierarchy
argument-hint: "[audit|build] [file, component, page or description — optional]"
---
Premium design pass for: $ARGUMENTS

## 0. Decide the mode and target
- **Audit:** the first word is `audit`, or the target already exists. Review it, fix the issues, report what changed.
- **Build:** the first word is `build`, or the target is a description of something new. Create it to this standard.
- If no target is given, use the files changed in this session (or `git diff` in a git repository). If that's empty, ask what to work on.
- Read the project's existing styles first: colour tokens, fonts, spacing scale, radius, shadows, animation library and easing. Reuse them. Premium means a more refined version of this brand, not a different brand. Don't change brand colours, fonts or content unless asked.
- Everything in `/design-guidelines` still applies (mobile-first, semantic HTML, WCAG AA contrast, keyboard access, reduced motion). Polish never comes at the cost of accessibility.

## 1. Visual hierarchy
- Each view has one clear focal point, then a secondary level, then supporting detail. Squint test: the most important thing stands out first.
- Create hierarchy with size, weight and space before adding colour.
- Strong type scale: a large, tight display heading (line-height about 0.9–1.1, slightly negative letter-spacing), small uppercase eyebrow labels with wide letter-spacing, comfortable body text (line-height 1.5–1.6) in a softer colour than headings.
- Limit emphasis: one accent colour for actions and highlights, used sparingly. One primary button per view.
- Group related content tightly and separate groups generously.

## 2. Premium aesthetics
- **Whitespace:** generous and deliberate. Large section padding (roughly 96–160px on desktop, 64–96px on mobile). Let content breathe.
- **Colour:** mostly neutral surfaces with a single strong brand accent. Use tints of the accent for soft backgrounds instead of new colours. Near-black instead of pure black for text if the brand allows.
- **Depth:** soft, layered shadows (several low-opacity layers with large blur) rather than one hard shadow. Subtle 1px borders in a neutral tint. Avoid heavy gradients and glows unless they're part of the brand.
- **Shape:** one consistent radius scale (for example 8 / 14 / 24px) used the same way everywhere.
- **Imagery:** high-resolution, consistent crop and aspect ratios, `object-fit: cover` (or `contain` with padding for logos), no stretched or blurry images. Never upscale small images past about 1.5×; choose a smaller slot instead.
- **Details:** aligned edges, optical balance, consistent icon sizes and stroke widths, no orphaned single words in headings where avoidable (`text-wrap: balance`).

## 3. Modern card layouts
- Use CSS Grid with consistent gaps from the spacing scale; `repeat(auto-fill, minmax(…, 1fr))` for even grids, or a 12-column grid with spans for editorial layouts.
- Vary card sizes intentionally (one feature card plus supporting cards) rather than randomly; keep rows aligned.
- Card anatomy: media → eyebrow/category → title → short description → meta or action. Same order and spacing in every card.
- Equal heights within a row; text clamped to a set number of lines so cards don't jump.
- The whole card is one clickable target (a real `<a>` or `<button>`), with a clear hover and focus state.
- On mobile, collapse to one or two columns using natural image proportions.

## 4. Smooth transitions and motion
- Use the project's animation library if there is one (GSAP, Framer Motion, etc.); otherwise CSS transitions plus `IntersectionObserver`.
- Durations: 150–250ms for hover and press, 400–800ms for reveals and larger moves. Easing: smooth ease-out curves such as `cubic-bezier(0.16, 1, 0.3, 1)` for entering; never linear for UI.
- Card hover: small lift (`translateY(-4px)`), image zoom of about 1.03–1.05 inside a clipped frame, a slightly stronger shadow, and a reveal of the action label or arrow.
- Scroll reveals: fade plus a short upward move (about 24–48px), staggered by 50–100ms per item, once only.
- State changes (tabs, filters, modals): fade or slide out quickly, then in with a stagger. Keep the layout from jumping.
- Animate only `transform` and `opacity`; add `will-change` only during the animation.
- Respect `prefers-reduced-motion` and use `@media (hover: hover)` for hover-only effects.

## 5. Check and report
- Check in a browser at 360px, 768px and 1440px: screenshots of the default state, hover, and any open state (modal, menu, filter). Fix anything misaligned, cropped, blurry or overflowing.
- Confirm no horizontal scroll, no console errors, and keyboard focus visible on every interactive element.
- For **audit**, report a short table: **Issue → Fix → File:line**, grouped under Hierarchy, Aesthetics, Cards, Motion. List anything left as a decision for the user.
- For **build**, report what was created, where, and how it reuses the existing design tokens.
- Ask before large structural or visual redesigns that go beyond the target.
