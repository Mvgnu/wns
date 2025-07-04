import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ClientLayout from "@/components/layout/ClientLayout";
import Providers from "./providers";

const geistSans = localFont({
  src: [
    {
      path: '../public/fonts/geist/Geist-Thin.woff2',
      weight: '100',
      style: 'normal',
    },
    {
      path: '../public/fonts/geist/Geist-UltraLight.woff2',
      weight: '200',
      style: 'normal',
    },
    {
      path: '../public/fonts/geist/Geist-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/geist/Geist-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/geist/Geist-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/geist/Geist-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/geist/Geist-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/geist/Geist-Black.woff2',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: "--font-geist-sans",
  display: 'swap',
});

const geistMono = localFont({
  src: [
    {
      path: '../public/fonts/geist-mono/GeistMono-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/geist-mono/GeistMono-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/geist-mono/GeistMono-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/geist-mono/GeistMono-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: "--font-geist-mono",
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: "WNS Community - Sportgemeinschaft für Skater & Hobbysportler",
    template: "%s | WNS Community",
  },
  description: "Eine Community-Plattform für Skater und Hobbysportler zum Vernetzen, Erfahrungsaustausch und Zugang zu Ressourcen.",
  keywords: [
    "Skateboarding", "Mountainbiken", "Wandern", "Angeln", "Laufen", "Fotografie", 
    "Community", "Sport", "Outdoor-Aktivitäten", "Skatespots", "Trails", "Veranstaltungen"
  ],
  authors: [{ name: "WNS Community Team" }],
  creator: "WNS Community",
  publisher: "WNS Community",
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "https://wns-community.com",
    siteName: "WNS Community",
    title: "WNS Community - Sportgemeinschaft für Skater & Hobbysportler",
    description: "Eine Community-Plattform für Skater und Hobbysportler zum Vernetzen, Erfahrungsaustausch und Zugang zu Ressourcen.",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "WNS Community",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WNS Community - Sportgemeinschaft für Skater & Hobbysportler",
    description: "Eine Community-Plattform für Skater und Hobbysportler zum Vernetzen, Erfahrungsaustausch und Zugang zu Ressourcen.",
    images: ["/images/twitter-image.jpg"],
    creator: "@wnscommunity",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" }
    ],
    apple: "/icons/apple-touch-icon.png",
    shortcut: "/favicon.svg",
  },
  manifest: "/manifest.json",
  metadataBase: new URL("https://wns-community.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <ClientLayout>
            {children}
          </ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
