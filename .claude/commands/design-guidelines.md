---
description: Review or build UI against modern UI/UX rules (mobile-first, semantic HTML, spacing, WCAG contrast, micro-interactions)
argument-hint: "[file, component, page or URL — optional; defaults to current changes]"
---
Apply these design guidelines to: $ARGUMENTS

If no target is given, use the files changed in this session (or `git diff` in a git repository). If that is empty, ask which page or component to check.

Work in two modes:
- **Building or editing UI:** follow every rule below while writing the code.
- **Reviewing existing UI:** check each rule, fix what fails, and report what changed.

Before changing anything, read the project's existing styles (tokens, variables, spacing scale, fonts, colours) and reuse them. Don't introduce a second design system, and don't change the brand colours or overall look unless asked.

## 1. Mobile-first responsiveness
- Write base styles for small screens first, then add `min-width` media queries for larger ones. Match the project's existing breakpoints.
- No horizontal scrolling at any width from 320px up. Check `scrollWidth <= clientWidth`.
- Use fluid sizing (`%`, `fr`, `minmax()`, `clamp()`, `min()`/`max()`) instead of fixed pixel widths for layout.
- Touch targets at least 44×44px, with space between neighbouring targets.
- Body text at least 16px on mobile, readable line length (about 45–75 characters), line-height around 1.4–1.6.
- Images and video: `max-width: 100%`, `height: auto`, set `width`/`height` attributes to avoid layout shift, and `loading="lazy"` below the fold.
- Include `<meta name="viewport" content="width=device-width, initial-scale=1">` and never disable zoom.

## 2. Clean semantic HTML
- Use landmarks: `header`, `nav`, `main` (one per page), `section`/`article`, `aside`, `footer`.
- One `h1` per page, headings in order (no skipped levels for styling — style with CSS instead).
- Links go somewhere (`<a href>`); actions are `<button type="button">`. No clickable `div`s or `span`s.
- Lists use `ul`/`ol`; tabular data uses `table` with `th`.
- Every form control has a visible `<label>` (placeholder is not a label), correct `type` and `autocomplete`.
- Images: meaningful `alt` text, or `alt=""` when decorative.
- Use ARIA only when native HTML can't express it; never add ARIA that contradicts the element.

## 3. Consistent spacing and layout
- Use one spacing scale (for example 4/8px steps or the project's existing tokens). No one-off values like 13px or 37px.
- Keep the same spacing for the same relationship: related items closer, separate groups further apart.
- Align to a grid; consistent container widths and side gutters across sections.
- Use a limited type scale and consistent font weights; no more than two typefaces.
- Keep consistent corner radius, border and shadow styles for the same kind of element.

## 4. WCAG colour contrast and accessibility (AA minimum)
- Text contrast at least **4.5:1**; large text (24px+, or 18.66px+ bold) at least **3:1**.
- UI components and graphics (borders of inputs, icons, focus rings) at least **3:1** against their background.
- Check text over images and gradients at the worst point; add an overlay if needed.
- Never use colour alone to show state or meaning; add text, an icon or an underline.
- Every interactive element has a visible `:focus-visible` style. Never remove outlines without a replacement.
- Full keyboard support: logical tab order, Escape closes dialogs and menus, focus moves into modals and returns when they close.
- Calculate contrast ratios rather than guessing, and report the actual values for any colours you change or flag.

## 5. Micro-interactions
- Give every interactive element hover (on hover-capable devices), focus, active/pressed and disabled states.
- Show feedback within about 100ms: button press, form submit/loading, success and error messages.
- Durations: about 150–300ms for small UI changes, up to about 500ms for larger ones. Use ease-out for entering, ease-in for leaving.
- Animate only `transform` and `opacity` where possible; avoid animating layout properties (width, height, top, left).
- Respect `prefers-reduced-motion: reduce`: remove or tone down non-essential motion.
- Motion must explain something (state change, where content came from), not just decorate. No auto-playing motion that can't be paused if it runs longer than 5 seconds.
- Use `@media (hover: hover)` for hover-only effects so touch devices don't get stuck states.

## Checking and reporting
- Test at 360px, 768px and 1440px wide (and 320px for overflow). Use a browser or headless Chrome when available, and check for console errors.
- Keyboard-test the page: tab through every control and open/close every dialog or menu.
- Report results as a short table per category: **Pass / Fixed / Needs decision**, with file and line for each fix and the contrast ratios checked.
- Ask before making large layout or visual changes that go beyond fixing a rule.
