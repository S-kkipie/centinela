# Centinela — design system (locked)

Source DNA: `apps/web/public/mocks/intel.html` (Hallmark custom theme, chosen 2026-08-15).
This file is the single source of truth for visual decisions across the whole app.
Pages must SHARE this system — diversification is inverted on system-managed projects.

## Identity

- **Vibe:** "inteligencia gubernamental, ops-grade, utilitaria, sin decoración".
  Palantir-school: authority through restraint, data-first, zero ornament.
- **Genre:** modern-minimal. **Axes:** light / geometric-sans / chromatic-green ~165°.
- **Language:** Spanish (Colombia). Headings always roman — never italic.
- **Honest copy:** only real, verified numbers. Never invent metrics, logos, testimonials.

## Color (OKLCH — tokens only, never inline values)

| Token | Value | Role |
|---|---|---|
| `--color-paper` | `oklch(97% 0.006 170)` | page background (light engineering gray) |
| `--color-paper-2` | `oklch(94.5% 0.008 170)` | recessed background / alt sections |
| `--color-panel` | `oklch(98.8% 0.005 170)` | cards, panels |
| `--color-rule` | `oklch(85% 0.012 170)` | borders (strong) |
| `--color-rule-2` | `oklch(90% 0.009 170)` | borders (soft) |
| `--color-muted` | `oklch(44% 0.014 170)` | secondary text |
| `--color-neutral` | `oklch(34% 0.014 170)` | tertiary ink |
| `--color-ink` | `oklch(18% 0.012 170)` | primary text |
| `--color-ink-2` | `oklch(30% 0.013 170)` | subheads |
| `--color-accent` | `oklch(47% 0.135 165)` | verde esmeralda — THE signal. Primary buttons, active states, OPORTUNIDAD |
| `--color-accent-soft` | `oklch(93% 0.030 165)` | accent tint fills |
| `--color-flag` | `oklch(48% 0.170 25)` | rojo — RESERVED for BANDERA_ROJA / destructive only |
| `--color-flag-soft` | `oklch(94% 0.030 25)` | flag tint fills |
| `--color-focus` | `oklch(45% 0.190 165)` | focus rings (2px solid, offset 2, never animated) |

Dark mode (`.dark`, dashboard-friendly ops console): invert paper→`oklch(16% 0.012 170)`,
panel `oklch(20% 0.012 170)`, ink→`oklch(94% 0.008 170)`, rules at low-alpha white,
accent lifted to `oklch(72% 0.135 165)`, flag `oklch(66% 0.17 25)`. Same hues, same roles.

**Signature effect:** faint 32px grid substrate on page background
(`linear-gradient` × 2, line = `color-mix(in oklab, var(--color-rule) 42%, transparent)`).
Utility class: `.bg-grid-ops`.

## Type (2+1 rule)

- **Display:** Space Grotesk 500/700 (`--font-display`) — h1–h3, letter-spacing −0.02em, lh 1.1.
- **Body:** Inter Tight 400/600 (`--font-body`) — lh 1.55.
- **Mono (machine-data register only):** IBM Plex Mono 400/500/600 (`--font-mono`) —
  status labels (all-caps, tracked), scores, NITs, timestamps, log lines, buttons-as-commands, colophon.
  Mono is the voice of the agent; sans is the voice of the product. Never mix roles.

Loaded via `next/font/google` in `src/app/layout.tsx` (variables `--font-display`, `--font-body`, `--font-mono`).

## Space, shape, motion

- 4pt scale. Radius: 4px (controls), 6px (panels) — `--radius: 0.25rem` in shadcn terms. No pills, no big rounding.
- Page max-width 72rem.
- Motion: `--ease-out: cubic-bezier(0.16,1,0.3,1)`; durations 120/220/420ms. Max 3 motion
  primitives per page. Animate transform/opacity only. Always `prefers-reduced-motion` fallback.
- Density over air in the app (dashboard = console); more air on the landing.

## shadcn mapping (globals.css)

`--background`=paper · `--foreground`=ink · `--card`=panel · `--primary`=accent ·
`--secondary`=paper-2 · `--muted`=paper-2/muted · `--accent`=accent-soft ·
`--destructive`=flag · `--border`=rule-2 · `--input`=rule-2 · `--ring`=focus.

## Component voice

- **Status labels:** mono, uppercase, tracked (`.label-ops`): `EN VIVO`, `BARRIDO`, `HALLAZGO`.
- **Score chips:** mono, `KIND · NN` (e.g. `BANDERA_ROJA · 65` red / `OPORTUNIDAD · 85` green).
- **Panels:** hairline border, panel bg, small radius; optional mono panel header strip.
- **Live indicator:** pulsing accent dot (reduced-motion: static).
- **Buttons:** rectangular, mono uppercase label ok for command-style CTAs; primary = accent fill.
- **No fake chrome:** never traffic-light dots / fake browser or IDE windows. Schematic panels in own tokens are fine.

## Aceternity UI (ui.aceternity.com — free, copy-paste, uses `motion` + `cn`)

Approved (fit ops restraint): Spotlight · Grid/Dot backgrounds · Card Spotlight ·
Hover Border Gradient (CTA) · Text Generate Effect (hero only) · Tracing Beam ·
Timeline · Animated Tooltip · Multi Step Loader · Stateful Button · Following Pointer (graph).
Banned (off-brand): Aurora/Wavy/Meteors/Shooting Stars backgrounds, 3D Card/Pin,
Lamp Effect, Sparkles, Colourful Text, anything glossy/cosmic.
Recolor every copied component to tokens — no hardcoded slate/indigo from the docs.
Shared location: `src/frontend/components/aceternity/<name>.tsx`.
