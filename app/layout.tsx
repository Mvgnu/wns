import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/layout/ClientLayout";
import ClientErrorBoundary from "@/components/layout/ClientErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        <ClientErrorBoundary>
          <ClientLayout>
            {children}
          </ClientLayout>
        </ClientErrorBoundary>
      </body>
    </html>
  );
}
