

import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import React from "react";
import Script from "next/script";
import { AuthProvider } from "@/provider/AuthProvider";
import { GA_TRACKING_ID } from "@/lib/analytics";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";
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
  title: "Vestidos de Fiesta Importados en Lima | Womanity San Isidro",
  description:
    "Descubre +1000 vestidos de fiesta importados en nuestro showroom de San Isidro. Vestidos de cóctel, gala y noche. WhatsApp 956-382-746. ¡Visítanos!",
  keywords:
    "vestidos de fiesta lima, showroom san isidro, vestidos elegantes perú, vestidos importados, womanity boutique, vestidos de noche, vestidos de gala, vestidos de boda lima",
  authors: [{ name: "Womanity Boutique" }],
  alternates: {
    canonical: "https://www.vestido.shop/",
  },
  openGraph: {
    type: "website",
    url: "https://www.vestido.shop/",
    title: "Vestidos de Fiesta Importados en Lima | Womanity San Isidro",
    description:
      "Descubre +1000 vestidos de fiesta importados en nuestro showroom de San Isidro. Diseños exclusivos para tus eventos.",
    siteName: "Vestido.shop by Womanity",
    images: [
      {
        url: "https://storage.googleapis.com/aistudio-hosting/VENICE-og-image.jpg",
        width: 1200,
        height: 630,
      },
    ],
    locale: "es_PE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vestidos de Fiesta Importados en Lima",
    description:
      "Showroom San Isidro. +1000 modelos exclusivos de marcas USA.",
    creator: "@WomanityBoutique",
    images: [
      "https://storage.googleapis.com/aistudio-hosting/VENICE-og-image.jpg",
    ],
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




        {/* JSON-LD Structured Data for SEO & AI Understanding */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Vestidos de Fiesta en Lima | Showroom en San Isidro",
              url: "https://www.vestido.shop/",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate:
                    "https://www.vestido.shop/?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
              publisher: {
                "@type": "Organization",
                name: "Womanity Boutique",
                logo: {
                  "@type": "ImageObject",
                  url: "https://storage.googleapis.com/aistudio-hosting/VENICE-logo.png",
                },
              },
              description:
                "Encuentra vestidos elegantes e importados en nuestro showroom de San Isidro. Diseños exclusivos para tus eventos en Lima, Perú.",
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
                  item: "https://www.vestido.shop/",
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
              "name": "Vestido.shop by Womanity",
              "image": "https://storage.googleapis.com/aistudio-hosting/VENICE-logo.png",
              "url": "https://www.vestido.shop/",
              "logo": "https://storage.googleapis.com/aistudio-hosting/VENICE-logo.png",
              "description": "Showroom de vestidos de fiesta importados de marcas USA en San Isidro, Lima. Más de 1000 modelos exclusivos.",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Av. Paz Soldán 255 Sótano A24",
                "addressLocality": "San Isidro",
                "addressRegion": "Lima",
                "postalCode": "15073",
                "addressCountry": "PE"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": -12.0954,
                "longitude": -77.0347
              },
              "telephone": "+51956382746",
              "priceRange": "$$",
              "openingHoursSpecification": [
                {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday"
                  ],
                  "opens": "11:00",
                  "closes": "20:00"
                }
              ],
              "sameAs": [
                "https://www.facebook.com/WomanityBoutique",
                "https://www.instagram.com/WomanityBoutique",
                "https://www.tiktok.com/@WomanityBoutique"
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
              mainEntity: [
                {
                  "@type": "Question",
                  name: "¿Cómo puedo saber cuál es mi talla correcta?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Recomendamos revisar nuestra guía de tallas detallada, disponible en la descripción de cada producto. Si tienes dudas, nuestro equipo de estilistas está disponible por WhatsApp para ofrecerte una asesoría personalizada y asegurar que encuentres el ajuste perfecto.",
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
        {/* 
        {GA_TRACKING_ID && GA_TRACKING_ID !== "G-XXXXXXXXXX" && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_TRACKING_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
        */}
        <AuthProvider>
          <CartProvider>
            <div id="root">{children}</div>
            <CartDrawer />
            <Chatbot />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
