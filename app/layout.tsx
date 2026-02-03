import type { Metadata, Viewport } from "next";
import React from "react";

export const viewport: Viewport = {
  themeColor: "#f5f5f4",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Vestidos de Fiesta en Lima | Showroom en San Isidro",
  description:
    "Encuentra vestidos elegantes e importados en nuestro showroom de San Isidro. Diseños exclusivos para tus eventos en Lima, Perú.",
  keywords:
    "vestidos de fiesta lima, showroom san isidro, vestidos elegantes perú, vestidos importados, moda san isidro, womanity boutique, vestidos de noche, vestidos de gala, boutique en lima",
  authors: [{ name: "Womanity Boutique" }],
  openGraph: {
    type: "website",
    url: "https://www.vestido.shop/",
    title: "Vestidos de Fiesta en Lima | Showroom en San Isidro",
    description:
      "Encuentra vestidos elegantes e importados en nuestro showroom de San Isidro. Diseños exclusivos para tus eventos en Lima, Perú.",
    siteName: "Vestidos de Fiesta por Womanity Boutique",
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
    title: "Vestidos de Fiesta en Lima | Showroom en San Isidro",
    description:
      "Encuentra vestidos elegantes e importados en nuestro showroom de San Isidro. Diseños exclusivos para tus eventos en Lima, Perú.",
    creator: "@WomanityBoutique",
    images: [
      "https://storage.googleapis.com/aistudio-hosting/VENICE-og-image.jpg",
    ],
  },
  robots: "index, follow",
  canonical: "https://www.vestido.shop/",
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
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />

        <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
        <script>
          {`
            tailwind.config = {
              darkMode: 'class',
            }
          `}
        </script>

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://storage.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Inter:wght@300;400;500&display=swap"
          rel="stylesheet"
        />

        <style>{`
          body {
            font-family: 'Inter', sans-serif;
          }
          h1, h2, h3, h4, h5, h6 {
            font-family: 'Cormorant Garamond', serif;
          }
          @keyframes fade-in-down {
            from {
              opacity: 0;
              transform: translateY(-1rem);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in-down {
            animation: fade-in-down 0.3s ease-out forwards;
          }
          
          /* Global scrollbar styles */
          * {
            scrollbar-width: thin;
            scrollbar-color: #d6d3d1 #f5f5f4;
          }
          
          *::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          *::-webkit-scrollbar-track {
            background: #f5f5f4;
          }
          
          *::-webkit-scrollbar-thumb {
            background: #d6d3d1;
            border-radius: 4px;
          }
          
          *::-webkit-scrollbar-thumb:hover {
            background: #a8a29e;
          }
          
          /* Dark mode scrollbar */
          .dark * {
            scrollbar-color: #57534e #292524;
          }
          
          .dark *::-webkit-scrollbar-track {
            background: #292524;
          }
          
          .dark *::-webkit-scrollbar-thumb {
            background: #57534e;
          }
          
          .dark *::-webkit-scrollbar-thumb:hover {
            background: #78716c;
          }
        `}</style>

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
              "@type": "Organization",
              name: "Womanity Boutique",
              url: "https://www.vestido.shop/",
              logo: "https://storage.googleapis.com/aistudio-hosting/VENICE-logo.png",
              description:
                "Showroom de vestidos de fiesta importados en San Isidro, Lima. Diseños exclusivos para tus eventos.",
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer service",
                email: "contacto@womanity-boutique.com",
              },
              sameAs: [
                "https://www.facebook.com/WomanityBoutique",
                "https://www.instagram.com/WomanityBoutique",
                "https://www.tiktok.com/@WomanityBoutique",
              ],
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
      <body className="bg-stone-50">
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
