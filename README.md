# Holoverse — TCG storefront (Next.js + TypeScript + Tailwind)

A faithful port of the Holoverse prototype: a dark, holographic, RPG-flavored
trading-card storefront for Magic, Pokémon and One Piece (singles, sealed,
accessories, pre-orders). Spanish UI, dual ARS/USD pricing.

## Run

```bash
npm install
npm run dev
# open http://localhost:3000
```

Build for production:

```bash
npm run build && npm start
```

## Stack
- **Next.js 14** (App Router)
- **React 18** + **TypeScript**
- **Tailwind CSS** (configured; tokens mirror the design system)
- WebGL **LiquidChrome** hero backdrop (no external deps)

## Structure
```
app/
  layout.tsx      root <html>, fonts, metallic-icon SVG gradient
  page.tsx        renders <Holoverse/>
  globals.css     Tailwind directives + the full design system (tokens, classes)
components/
  Holoverse.tsx   the whole storefront (context, header/footer, all screens, menu)
  effects.tsx     HoloTilt (holographic card tilt) + LiquidChrome (WebGL bg)
lib/
  data.ts         mock catalog (singles / sealed / accessories) + helpers
tailwind.config.ts
```

## How it was built / notes
- This is a **direct port of an HTML/React prototype**, so the components use
  inline styles + the design-system classes in `globals.css` rather than Tailwind
  utility classes. Tailwind is fully wired up — migrate to utilities incrementally.
- `components/Holoverse.tsx` is intentionally one module so the components share
  scope exactly like the prototype. **Split it into per-feature files** as you
  integrate (Header, screens/, cards, etc.).
- `next.config.mjs` sets `typescript.ignoreBuildErrors` + `eslint.ignoreDuringBuilds`
  so the prototype runs as-is. Re-enable and add types as you harden it.
- All data is **mock** (`lib/data.ts`). Wire it to your real catalog / cart / auth.
- Design tokens (colors, fonts, radii) live as CSS variables in `globals.css`
  and are mirrored in `tailwind.config.ts`.
- Fonts: **Cinzel** (titles, silver-chrome), **Space Grotesk** (UI), **Manrope** (body).

## Key design behaviors to preserve
- Holographic foil + 3D tilt on cards (hover); rarity "loot" glow.
- Auto-cycling hero card fan (pauses on hover).
- LiquidChrome animated hero background (reacts to pointer).
- Staggered full-screen menu (hamburger → layered panel).
- Silver-chrome serif titles; metallic line icons (SVG gradient stroke).
