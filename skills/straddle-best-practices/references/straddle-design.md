# Straddle design for generated views

Source: `straddleio/design` (internal Straddle repository), commit `678810309d6da1c3778640e2bf7de0a0d10fb1e6` (2026-09-29), vendored 2026-10-01. Kept: the light-mode values of the color, type, radius, spacing and shadow tokens from `DESIGN.md` and `styles/tokens.css`, the font stacks from `styles/fonts.css`, and these `DESIGN.md` sections verbatim: two paragraphs of Overview, the Colors role list, Typography, Layout, Elevation & Depth, Shapes, Generated-design failures, and Do's and Don'ts. Left out: dark mode, the expressive palette (`PALETTE.md`), the token workflow (`THEMING.md`), and the component, Storybook, Tailwind and design-sync instructions, none of which a single generated file can use. Everything from "Overview" down is the source text unchanged; `tests/test_straddle_design.py` pins each section's sha256. "In a generated view" and the two token sections are Straddle's adaptation for show-me.

## In a generated view

A show-me HTML view is one self-contained file, so it can't install Straddle components or Tailwind. Write plain semantic HTML with one inline `<style>` that declares the tokens below, and treat the verbatim rules as follows:

- Light mode only. Set `color-scheme: light`, and add no dark theme or `prefers-color-scheme` switch. Ignore the source's dark-mode clauses.
- The page sits on `--background` with faintly warm paper surfaces above it: `--card` for raised content, `--field` for inputs, `--table-header` for table headers. Never pure white or black surfaces.
- Terminal Green (`--primary`, `--cta-primary`) marks actions and checked or focused controls only. A read-only view usually has none, so it shows little or no green. Links are underlined `--link` ink. Spark Green is a brand moment a generated view doesn't need.
- Status hues mark operational state only, always beside the status text.
- Fonts come from the stacks below: Geist only when it's installed locally, otherwise the system face. No `@font-face`, and no fonts, styles, scripts or images from the network.
- Every amount, ID, external ID, row number and timestamp uses a data role in `--font-mono` with `font-variant-numeric: tabular-nums`.
- No gradients, glass, glow, ornamental shadows, emoji, decorative icons or illustration.

## Light-mode tokens

```css
:root {
  color-scheme: light;
  /* Surface ladder, lowest to highest */
  --sidebar: #f2f2f2;              /* app frame and nav rail */
  --background: #fdfdfd;           /* page */
  --table-header: oklch(0.986 0.0024 92);
  --card: #fefdfb;                 /* raised content, faintly warm */
  --popover: #fffffd;              /* overlays */
  --field: #fffffd;                /* inputs */
  --muted: #eeede9;
  --secondary: #dfdeda;            /* secondary actions */
  /* Ink */
  --foreground: #282828;
  --muted-foreground: #555555;
  --secondary-foreground: #282828;
  --link: #23211e;                 /* underlined neutral ink */
  /* Terminal Green: actions and interactive controls only */
  --cta-primary: oklch(0.32 0.06 165);  /* primary action at rest */
  --primary: #00684a;              /* primary action hover, checked controls, default badge */
  --primary-foreground: #f8f5ee;
  --ring: oklch(0.5 0.1 165);      /* focus ring for actions and fields */
  --accent-brand: #00ed64;         /* Spark Green, rare brand moment */
  /* Achromatic washes */
  --selected: oklch(0.27 0 0 / 0.08);
  --row-hover: oklch(0.27 0 0 / 0.05);
  /* Status, one meaning each, never color alone */
  --success: oklch(0.54 0.14 150);
  --warning: oklch(0.74 0.15 78);
  --info: oklch(0.52 0.104 235);
  --destructive: oklch(0.54 0.22 27);
  --badge-neutral-bg: #f4f3f1;     /* status chip: neutral mono chip with a colored dot */
  --badge-default-bg: #00684a;
  --badge-default-fg: #eef8f3;
  /* Depth and shape */
  --shadow-raised: 0 1px 2px 0 oklch(0.21 0.012 265 / 0.05), 0 2px 6px -1px oklch(0.21 0.012 265 / 0.05);
  --radius-badge: 4px;
  --radius-control: 8px;           /* buttons, inputs */
  --radius-card: 12px;
  --radius-container: 16px;
  /* Spacing: 4px base, 8px rhythm */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 24px;
  --space-2xl: 32px;
  --control-height: 36px;
  /* Type */
  --font-sans: "Geist", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
```

## Type roles

| Role | Font | Size / weight / line height | Use |
| --- | --- | --- | --- |
| heading-1 | sans | 30px / 400 / 1.13, letter-spacing -0.044rem | the one `h1` |
| title | sans | 24px / 400 / 1.333 | section titles |
| section | sans | 20px / 400 / 1.4 | sub-sections |
| body | sans | 16px / 400 / 1.5 | reading text |
| body-medium | sans | 16px / 500 / 1.5 | emphasis |
| caption | sans | 14px / 400 / 1.43 | supporting text |
| label | sans | 12px / 500 / 1.4 | field and column labels |
| badge | mono | 11px / 500 / 1.4 | status chips |
| data-large | mono, tabular | 24px / 500 / 1.2, letter-spacing -0.031rem | a decisive amount |
| data-body | mono, tabular | 16px / 400 / 1.4 | values in text |
| data-small | mono, tabular | 13px / 500 / 1.4 | table values, IDs |
| data-micro | mono, tabular | 11px / 500 / 1.4, letter-spacing 0.031rem | dense metadata |

## Overview

Design Straddle product interfaces as working payment infrastructure. The primary users move money, investigate exceptions, onboard accounts, review risk, and operate systems where mistakes have consequences. The interface must make the next task, current state, critical amounts, and exceptional conditions easy to find without hiding the audit record.

Precise, calm, technical, and trustworthy are earned through intact facts, obvious hierarchy, efficient repeated work, unambiguous state, and consistent actions. Do not imitate a generic SaaS dashboard, marketing page, or decorative fintech skin.

## Colors

- Terminal Green is the single action and interactive-control color. Primary buttons rest on dark green in light mode and lighten to Terminal Green on hover. Checked controls, focus rings, and default badges share it. Success remains a separate status hue.
- Spark Green is the reserved brand accent. Use it for a small, deliberate brand moment, never as routine text, selection, focus, or status.
- Selection and row hover use achromatic washes. Links use underlined neutral ink. Actions and fields focus green; choice controls focus blue.
- Success, warning, information, and destructive hues keep one operational meaning. Pair color with text, shape, position, or an icon so color is never the only signal.
- Light mode is a neutral page with faintly warm surfaces. Dark mode is a native cool-slate ladder. Preserve the relationship from background to card to popover and field.

Background is the page, including standalone pages. The app frame and nav rail use sidebar. Rail hover and selection share one fill.

## Typography

Use the published typography roles rather than raw font sizes.

- Geist handles headings, reading, navigation, labels, and controls.
- Geist Mono is the data voice. Apply a `text-data-*` role to every amount, payment ID, paykey, routing number, account identifier, and timestamp. Use tabular numerals for aligned comparisons.
- Geist Mono also handles badges, code, commands, paths, and compact technical markers.
- Headings state the task, state change, or decision in sentence case. Avoid decorative eyebrows and generic headings such as “Overview” when a concrete statement is available.
- CSS never changes case; API values such as `on_hold` render as returned.
- Equivalent values and peer labels use the same role, size, weight, line height, and numeric treatment. Do not resize a value because its string is longer.

Keep body text readable. Rewrite before shrinking. Hierarchy also comes from role, spacing, and grouping.

## Layout

Straddle supports dense operational screens. Compact means repeated work stays efficient; cramped means labels, controls, or values collide or become hard to scan.

Use the 4px base and 8px working rhythm exposed by the system. Let one owner set each gap. Align toolbars, forms, repeated rows, and actions to shared edges and baselines. Give wide evidence, including dense tables and charts, enough width before adding a prose rail or another card.

On narrow screens, preserve task order rather than desktop geometry. Move the primary action with the object it affects, stack comparisons that no longer scan, and use local table scrolling only when reordering or simplifying columns would damage lookup. Never hide page overflow to conceal a layout failure.

## Elevation & Depth

Depth communicates function:

- **Raised:** cards and floating panels cast a soft shadow with no border in both themes; dark also steps them up in lightness.
- **Flat:** tables and the page stay on the ground. Header tone and row hover define structure, not dividers. Do not wrap a table in a raised card.
- **Field:** inputs rest on the lightest filled surface with a slight lift and no border. Hover adds an edge. Disabled fields sit in a recessed wash.

Separate surfaces with elevation and spacing, not lines. A stroke marks an operable control or a focus or invalid state. Never nest cards.

## Shapes

Keep shapes crisp and engineered. Controls and inputs use the published 8px radius, cards use 12px, and larger containers may use 16px. Badges stay near-rectangular at 4px. Reserve fully rounded shapes for avatars, switches, and true pills.

Equivalent objects use the same radius. Do not turn ordinary metadata into rounded capsules.

## Generated-design failures

Reject these recurring outputs:

- **Generic SaaS dashboard:** A centered heading, decorative summary cards, and equal panels replace the actual operational task.
- **Card quilt:** Every section, metric, table, and note receives its own raised container, flattening hierarchy and wasting space.
- **Marketing hero in a tool:** Oversized copy or ornamental numbers delay the queue, form, record, or action the user opened the page to use.
- **Status confetti:** Colorful badges, pills, or icons decorate ordinary metadata and weaken the meaning of true operational states.
- **One-font flattening:** Amounts, identifiers, timestamps, labels, and prose share one treatment, making financial data harder to scan.
- **Decorative data:** Charts, progress bars, or large values appear without a decision, honest scale, unit, comparator, or exact record.
- **Palette leakage:** Expressive colors replace semantic action, status, focus, selection, or link roles.
- **Desktop squeeze:** A desktop split is compressed onto mobile, or page overflow is hidden instead of recomposing the task.
- **Motion fog:** Broad transitions, repeated reveals, or hover movement compete with reading and repeated keyboard work.

## Do's and Don'ts

- **Do** preserve the task, facts, and audit record before refining presentation.
- **Do** use Straddle components, semantic roles, and published typography utilities.
- **Do** set every amount, identifier, routing number, paykey, and timestamp in the Geist Mono data voice.
- **Do** keep tables flat, cards raised, fields filled, and overlays distinct.
- **Do** reserve Terminal Green for actions and checked controls, Spark Green for rare brand emphasis, and status hues for their named state.
- **Do** keep product density efficient and responsive task order explicit.
- **Don't** nest cards, wrap tables in cards, or use repeated metric boxes when aligned text or one composed comparison is clearer.
- **Don't** hand-paint components with hex values, built-in Tailwind palette colors, or raw expressive colors inside reusable product UI.
- **Don't** use pure black or white surfaces, decorative gradients, glass effects, ornamental shadows, or glow as a substitute for hierarchy.
- **Don't** use badges for ordinary labels, color as the only state cue, or icons as decoration.
- **Don't** animate ordinary UI over 300ms, use `transition: all`, or animate repeated keyboard actions.
- **Don't** invent customer facts, product behavior, approvals, urgency, or claims to fill an information gap.
