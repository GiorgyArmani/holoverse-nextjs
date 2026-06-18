import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Cinzel, Space_Grotesk, Manrope } from "next/font/google";

/* solo los pesos que usa el CSS (los intermedios caen al más cercano) */
const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-cinzel",
  display: "swap",
});
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-grotesk",
  display: "swap",
});
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://holoverse.com.ar";
const SITE_NAME = "Holoverse";
const DESCRIPTION =
  "Tienda online de TCG en Banfield, Buenos Aires: singles chase, producto sellado y accesorios de Magic: The Gathering, Pokémon y One Piece. Envíos nacionales e internacionales y preventas abiertas.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Holoverse — Tienda TCG · Magic, Pokémon y One Piece",
    template: "%s · Holoverse TCG",
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "TCG Argentina",
    "Magic The Gathering",
    "Pokémon TCG",
    "One Piece Card Game",
    "cartas singles",
    "producto sellado",
    "booster box",
    "fundas y accesorios",
    "tienda de cartas Buenos Aires",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "es_AR",
    title: "Holoverse — Tienda TCG · Magic, Pokémon y One Piece",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Holoverse — Tienda TCG · Magic, Pokémon y One Piece",
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "shopping",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0712",
};

/* Store structured data for rich results */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: SITE_NAME,
  description: DESCRIPTION,
  url: SITE_URL,
  currenciesAccepted: "ARS, USD",
  paymentAccepted: "Tarjeta de crédito, Mercado Pago, Cripto",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Buenos Aires",
    addressRegion: "CABA",
    addressCountry: "AR",
  },
  makesOffer: [
    { "@type": "Offer", category: "Magic: The Gathering singles y sellado" },
    { "@type": "Offer", category: "Pokémon TCG singles y sellado" },
    { "@type": "Offer", category: "One Piece Card Game singles y sellado" },
    { "@type": "Offer", category: "Accesorios TCG" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return (
    <html lang="es" className={`${cinzel.variable} ${grotesk.variable} ${manrope.variable}`}>
      <head>
        {/* adelanta el handshake TLS con la DB (auth/wishlist) y los CDNs de imágenes */}
        {supabaseUrl && <link rel="preconnect" href={supabaseUrl} crossOrigin="anonymous" />}
        <link rel="preconnect" href="https://cards.scryfall.io" />
        <link rel="preconnect" href="https://assets.tcgdex.net" />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* metallic icon gradient referenced by the Icon component (stroke url(#ic-chrome)) */}
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
          <defs>
            <linearGradient id="ic-chrome" x1="0" y1="0" x2="0.8" y2="1">
              <stop offset="0" stopColor="#f6f6fc" />
              <stop offset="0.38" stopColor="#c2c0d6" />
              <stop offset="0.52" stopColor="#8d8aa4" />
              <stop offset="0.66" stopColor="#eceaf4" />
              <stop offset="1" stopColor="#9a98b2" />
            </linearGradient>
          </defs>
        </svg>
        {children}
      </body>
    </html>
  );
}
