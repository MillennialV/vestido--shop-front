import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import localFont from "next/font/local";
import "@/app/globals.css";
import React from "react";
import Script from "next/script";
import { AuthProvider } from "@/provider/AuthProvider";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { CategoryProvider } from "@/context/CategoryContext";
import { RemoteThemeProvider } from "@/context/RemoteThemeContext";
import CartModal from "@/components/modals/CartModal";
import { Chatbot } from "@/components/ui/Chatbot";
import { getRemoteThemeData } from "@/lib/theme-data";
import { getDomain } from "@/lib/get-domain";
import { StoreNotFound } from "@/components/ui/StoreNotFound";
import { DEFAULT_SEO, DEFAULT_STORE_INFO, SOCIAL_DEFAULTS, SCHEMA_DEFAULTS, ABREPE_DISPLAY_NAME, DEFAULT_OG_IMAGE } from "@/lib/constants";

const allrounder = localFont({
  src: [
    {
      path: "../fonts/AllrounderMonumentTest-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/AllrounderMonumentTest-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/AllrounderMonumentTest-Book.otf",
      weight: "300",
      style: "normal",
    },
  ],
  variable: "--font-allrounder",
});

export async function generateMetadata(): Promise<Metadata> {
  const { storeInfo, metadata } = await getRemoteThemeData();

  const title = storeInfo?.title || DEFAULT_SEO.title;
  const description = storeInfo?.description || DEFAULT_SEO.description;

  return {
    title,
    description,
    metadataBase: await (async () => {
      try {
        const domain = await getDomain();
        const protocol = domain.includes('localhost') ? 'http' : 'https';
        const base = metadata?.metadata_base || `${protocol}://${domain}`;
        return new URL(base && base.startsWith("http") ? base : `${protocol}://${domain}`);
      } catch {
        return new URL(DEFAULT_SEO.canonical);
      }
    })(),
    keywords: metadata?.keywords || DEFAULT_SEO.keywords,
    authors: [{ name: storeInfo?.title || ABREPE_DISPLAY_NAME }],
    icons: {
      icon: storeInfo?.logo_url || '/favicon.ico',
      apple: storeInfo?.logo_url || '/favicon.ico',
    },
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      title,
      description,
      siteName: storeInfo?.title || DEFAULT_SEO.siteName,
      images: metadata?.og_image_default ? [{ url: metadata.og_image_default }] : [{ url: DEFAULT_OG_IMAGE }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: metadata?.twitter_site || SOCIAL_DEFAULTS.twitter,
      creator: metadata?.twitter_creator || SOCIAL_DEFAULTS.twitterCreator,
      images: metadata?.og_image_default ? [metadata.og_image_default] : [DEFAULT_OG_IMAGE],
    },
    robots: DEFAULT_SEO.robots,
    verification: {
      google: metadata?.google_site_verification,
    }
  };
}

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { storeInfo, metadata, colors } = await getRemoteThemeData();
  const domain = await import('@/lib/get-domain').then(m => m.getDomain());
  const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'https://auth.vestido.shop';

  // Obtener organización en el servidor para evitar parpadeo en el Header
  let organization = null;
  try {
    const orgRes = await fetch(`${AUTH_SERVICE_URL}/api/organizations/domain/${domain}`, { cache: 'no-store' });
    if (orgRes.ok) {
      const orgData = await orgRes.json();
      organization = orgData.data?.organization || null;
    }
  } catch (e) {
    console.error("Error fetching org in layout:", e);
  }

  const siteTitle = storeInfo?.title || DEFAULT_STORE_INFO.title;
  const siteDesc = storeInfo?.description || DEFAULT_STORE_INFO.description;
  const siteAddress = storeInfo?.address || DEFAULT_STORE_INFO.address;
  const sitePhone = storeInfo?.whatsapp || DEFAULT_STORE_INFO.phone;

  // Si no hay información de la tienda, mostrar la página de "No Encontrado"
  if (!storeInfo) {
    return (
      <html lang="es" className={`${allrounder.variable}`} suppressHydrationWarning>
        <body className={`${inter.variable} ${cormorant.variable} bg-stone-50 font-sans`}>
          <StoreNotFound />
        </body>
      </html>
    );
  }

  return (
    <html lang="es" className={`${allrounder.variable}`} suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* Inyección de colores de tema desde el servidor para evitar FOUC */}
        {colors && colors.color_one && (
          <style dangerouslySetInnerHTML={{
            __html: `
              :root {
                --color-one: ${colors.color_one};
                --color-two: ${colors.color_two};
                --color-three: ${colors.color_three};
                --color-four: ${colors.color_four};
                --color-color-one: ${colors.color_one};
                --color-color-two: ${colors.color_two};
                --color-color-three: ${colors.color_three};
                --color-color-four: ${colors.color_four};
              }
            `
          }} />
        )}

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
              name: siteTitle,
              url: DEFAULT_SEO.canonical,
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate:
                    `${DEFAULT_SEO.canonical}/?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
              publisher: {
                "@type": "Organization",
                name: siteTitle,
                logo: {
                  "@type": "ImageObject",
                  url: metadata?.json_ld_logo || SCHEMA_DEFAULTS.logo,
                },
              },
              description: siteDesc,
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
                  item: DEFAULT_SEO.canonical,
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
              "name": siteTitle,
              "image": metadata?.og_image_default || DEFAULT_OG_IMAGE,
              "url": DEFAULT_SEO.canonical,
              "logo": metadata?.json_ld_logo || SCHEMA_DEFAULTS.logo,
              "description": siteDesc,
              "address": {
                "@type": "PostalAddress",
                "streetAddress": siteAddress,
                "addressLocality": metadata?.address_locality || "San Isidro",
                "addressRegion": metadata?.address_region || "Lima",
                "postalCode": metadata?.postal_code || "15073",
                "addressCountry": metadata?.address_country || "PE"
              },
              "email": storeInfo?.email,
              "telephone": sitePhone ? `+${sitePhone.replace(/\D/g, '')}` : undefined,
              "priceRange": metadata?.json_ld_price_range || "$$",
              "openingHoursSpecification": [
                {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": [
                    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
                  ],
                  "opens": "11:00",
                  "closes": "20:00"
                }
              ],
              "sameAs": [
                storeInfo?.facebook_url,
                storeInfo?.instagram_url,
              ].filter(Boolean)
            }),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "¿Cómo puedo saber cuál es mi talla correcta?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Recomendamos revisar nuestra guía de tallas detallada, disponible en la descripción de cada product. Si tienes dudas, nuestro equipo de estilistas está disponible por WhatsApp para ofrecerte una asesoría personalizada y asegurar que encuentres el ajuste perfecto.",
                  },
                },
                {
                  "@type": "Question",
                  name: "¿Cuál es la política de envíos y devoluciones?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Ofrecemos envío express a todo el país, con un tiempo de entrega de 24-48 horas en ciudades principales. Aceptamos devoluciones dentro de los primeros 7 días después de la recepción, siempre que la prenda esté en su estado original y con todas las etiquetas.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Los vestidos, ¿requieren algún cuidado especial?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Sí, al ser prendas de alta costura, recomendamos encarecidamente la limpieza en seco profesional. Evita lavar a máquina o usar secadoras. Para el almacenamiento, guárdalo en una funda para prendas en un lugar fresco y seco para preservar la calidad de los tejidos y detalles.",
                  },
                },
                {
                  "@type": "Question",
                  name: "¿Ofrecen arreglos o ajustes a medida?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Actualmente no ofrecemos un servicio de arreglos a medida, pero nuestros vestidos están diseñados para permitir ajustes menores por parte de un sastre profesional. Podemos recomendarte talleres de confianza si lo necesitas.",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className={`${inter.variable} ${cormorant.variable} bg-stone-50 font-sans`}>
        {process.env.NEXT_PUBLIC_GA_ID && process.env.NEXT_PUBLIC_GA_ID !== "G-XXXXXXXXXX" && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
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
          <RemoteThemeProvider
            initialColors={colors}
            initialStoreInfo={storeInfo}
            initialMetadata={metadata}
            initialOrganization={organization}
          >
            <ThemeProvider>
              <CategoryProvider>
                <CartProvider>
                  <div id="root">{children}</div>
                  <CartModal />
                  <Chatbot />
                </CartProvider>
              </CategoryProvider>
            </ThemeProvider>
          </RemoteThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
