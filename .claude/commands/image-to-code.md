---
description: Turn a design image (screenshot, mockup, Figma export) into pixel-accurate, responsive components
argument-hint: "<image path> [target file or component name] [notes]"
---
Convert this design image into code: $ARGUMENTS

## 0. Inputs
- The first argument is the image path. If it's missing or the file doesn't exist, ask for it. Supported: PNG, JPG, WebP, GIF, and PDF pages.
- Optional: a target file/folder or component name, and notes (e.g. "hero only", "use existing Button").
- Read the image with the Read tool and look at it closely before writing anything. If it is large or dense, also crop or zoom into regions (using a headless browser or canvas script) to read small text and exact edges.
- Note the image's pixel size and work out the design width it represents (for example a 1440px desktop or a 390px phone). If the image is 2× or 3×, divide measurements accordingly.

## 1. Match the project
- Detect the stack from the project (React/Next, Vue, Svelte, plain HTML/CSS, Tailwind, CSS modules, styled-components…) and write code in that style, following existing file locations and naming.
- Reuse existing design tokens, components, fonts and icons where they match. Only add new tokens when nothing existing fits, and say which ones you added.
- Don't add new dependencies without asking.

## 2. Extract the design (write this spec down before coding)
- **Layout & hierarchy:** sections from top to bottom; grid columns, alignment, which element is the focal point, what groups with what. Sketch it as a short outline.
- **Measurements:** container width, side margins, gaps, paddings, element sizes, border radius, borders, shadow offsets/blur. Measure in pixels from the image and snap to a consistent scale (usually 4 or 8px) when values are within 1–2px.
- **Colours:** sample exact hex values for backgrounds, text, accents, borders, overlays and gradients (pick pixels from the image with a canvas script rather than guessing). Group them into a small palette with roles.
- **Typography:** font family (identify it, or name the closest available match and say so), sizes, weights, line-heights, letter-spacing and text case for each text style. Derive line-height from baseline distances.
- **Assets:** photos, illustrations, icons and logos. Reuse project assets when they match; otherwise use clearly marked placeholders and list what's needed. Never invent brand logos or copy third-party artwork into the build.
- **States implied by the design:** hover, active, selected tabs, form errors, empty states.
- Copy text exactly as shown in the image. Don't rewrite it.

## 3. Build it
- Semantic HTML with accessible structure: landmarks, headings in order, real buttons and links, labelled inputs, `alt` text.
- Build the design's own width first so it matches pixel for pixel, then make it responsive:
  - fluid widths with `max-width` containers, grid/flex, `clamp()` for large type;
  - sensible breakpoints for phone, tablet and desktop; stack columns on small screens;
  - no horizontal scrolling at any width from 320px up.
- Infer anything the image can't show (other screen sizes, hover states) from the design's style, and list those assumptions.
- Keep WCAG AA contrast. If the image's colours fail it, keep them for pixel accuracy but flag the issue with the measured ratio.
- Keep components small and reusable, with props or variables for the content.

## 4. Verify against the image
- Render the result in a browser (headless Chrome if available) at the image's exact width and take a screenshot.
- Compare side by side, and with an overlay or pixel diff where possible. Check positions, sizes, colours, font sizes, line breaks, spacing and alignment.
- Fix differences and repeat until it matches closely (aim for within about 2px on layout; text rendering differences between fonts are acceptable).
- Also screenshot at 390px and 768px to confirm the responsive layout works.

## 5. Report
- Files created or changed.
- The extracted spec: palette (hex values and roles), type styles, spacing scale.
- Accuracy notes: where it differs from the image and why (missing font, unavailable asset, contrast fix).
- Assumptions made for breakpoints and states, and any placeholders that need real assets.
