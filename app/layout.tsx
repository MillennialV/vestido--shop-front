

import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import React from "react";
import Script from "next/script";
import { AuthProvider } from "@/provider/AuthProvider";
import { GA_TRACKING_ID } from "@/lib/analytics";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { SITE_CONFIG, CONTACT_INFO, DEFAULT_FAQs } from "@/lib/metadata-constants";
import CartModal from "@/components/CartModal";
import { Chatbot } from "@/components/Chatbot";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-cormorant",
});

export const viewport: Viewport = {
  themeColor: "#f5f5f4",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: SITE_CONFIG.defaultTitle,
  description: SITE_CONFIG.defaultDescription,
  keywords: SITE_CONFIG.keywords,
  authors: [{ name: SITE_CONFIG.brandName }],
  metadataBase: new URL(SITE_CONFIG.baseUrl),
  alternates: {
    canonical: SITE_CONFIG.baseUrl,
  },
  openGraph: {
    type: "website",
    url: SITE_CONFIG.baseUrl,
    title: SITE_CONFIG.defaultTitle,
    description: SITE_CONFIG.defaultDescription,
    siteName: SITE_CONFIG.name,
    images: [
      {
        url: SITE_CONFIG.ogImage,
        width: 1200,
        height: 630,
      },
    ],
    locale: SITE_CONFIG.locale,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_CONFIG.defaultTitle,
    description: SITE_CONFIG.defaultDescription,
    creator: SITE_CONFIG.twitterCreator,
    images: [SITE_CONFIG.ogImage],
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var dark = localStorage.getItem('darkMode');
                  var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches === true;
                  if (dark === 'true' || theme === 'dark' || (!theme && !dark && supportDarkMode)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />




        {/* JSON-LD Structured Data for SEO & AI Understanding */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: SITE_CONFIG.defaultTitle,
              url: SITE_CONFIG.baseUrl,
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate:
                    `${SITE_CONFIG.baseUrl}/?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
              publisher: {
                "@type": "Organization",
                name: SITE_CONFIG.brandName,
                logo: {
                  "@type": "ImageObject",
                  url: SITE_CONFIG.logoUrl,
                },
              },
              description: SITE_CONFIG.defaultDescription,
            }),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Inicio",
                  item: SITE_CONFIG.baseUrl,
                },
              ],
            }),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ClothingStore",
              "name": SITE_CONFIG.name,
              "image": SITE_CONFIG.logoUrl,
              "url": SITE_CONFIG.baseUrl,
              "logo": SITE_CONFIG.logoUrl,
              "description": SITE_CONFIG.defaultDescription,
              "address": {
                "@type": "PostalAddress",
                "streetAddress": CONTACT_INFO.address.street,
                "addressLocality": CONTACT_INFO.address.locality,
                "addressRegion": CONTACT_INFO.address.region,
                "postalCode": CONTACT_INFO.address.postalCode,
                "addressCountry": CONTACT_INFO.address.country
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": CONTACT_INFO.address.latitude,
                "longitude": CONTACT_INFO.address.longitude
              },
              "telephone": CONTACT_INFO.phone,
              "priceRange": "$$",
              "openingHoursSpecification": [
                {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": CONTACT_INFO.openingHours.days,
                  "opens": CONTACT_INFO.openingHours.opens,
                  "closes": CONTACT_INFO.openingHours.closes
                }
              ],
              "sameAs": [
                CONTACT_INFO.socialLinks.facebook,
                CONTACT_INFO.socialLinks.instagram,
                CONTACT_INFO.socialLinks.tiktok
              ]
            }),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: DEFAULT_FAQs.map(faq => ({
                "@type": "Question",
                name: faq.pregunta,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.respuesta,
                },
              })),
            }),
          }}
        />
      </head>
      <body className={`${inter.variable} ${cormorant.variable} bg-stone-50 font-sans`}>
        {process.env.NEXT_PUBLIC_GA_ID && process.env.NEXT_PUBLIC_GA_ID !== "G-XXXXXXXXXX" && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="lazyOnload"
            />
            <Script id="google-analytics" strategy="lazyOnload">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
        <AuthProvider>
          <ThemeProvider>
            <CartProvider>
              <div id="root">{children}</div>
              <CartModal />
              <Chatbot />
            </CartProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
