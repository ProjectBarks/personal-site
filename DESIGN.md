# DESIGN.md

Derived from the shipped v2.0 design (src/style.css, README "the design").

## Color (OKLCH; tinted toward the cobalt hue, never pure #000/#fff)
- `--bg`     warm-black   `oklch(0.16 0.012 265)`  (~#0a0b0d)
- `--panel`  raised       `oklch(0.20 0.014 265)`  (~#13141a)
- `--ink`    foreground   `oklch(0.93 0.006 265)`  (~#e8e9ed)
- `--muted`  secondary    `oklch(0.58 0.010 265)`  (~#75767f)
- `--accent` cobalt       `oklch(0.55 0.24 264)`   (~#2e5bff)
- `--rule`   hairline     `oklch(0.24 0.014 265)`  (~#1a1c22)

Color strategy: **Restrained.** Cobalt is the only accent and stays under ~10%
of the surface: prompt username, ASCII banner glow, links, live cursor, active
nav item. Everything else is neutral.

Theme: **dark, deliberately.** Scene: an engineer opening the link in a dim
room at night, expecting a terminal, not a brochure. The shell metaphor forces
dark.

## Typography
- One family: **JetBrains Mono** (400/500/700). Monospace is the identity.
- Body 14px / line-height 1.7. Hierarchy from weight (400 vs 500/700) and the
  `## section` prefix, not from many sizes.
- Everything lowercase. Tabular-nums for the year column.

## Layout
- Single column, `max-width: 780px`, generous top padding.
- Rows: `year | body | meta` grid, separated by 1px dashed `--rule`.
- Sections labelled `## work`, `## projects` with a muted count.
- Soft cobalt radial "aurora" bleed in the top corner for atmosphere.

## Motion
- Blinking block cursor (steps animation) only. No transitions on layout.
- Hover: subtle cobalt wash on links/rows.

## Multi-page additions
- A nav row of shell paths (`~`, `~/projects`, `~/writing`, `~/cv`); the active
  path is inked and underlined in cobalt. The nav is NOT a second command
  prompt, it is the output of one implied listing, so it never stacks a second
  `user@host :~$` line above the page's own prompt.
