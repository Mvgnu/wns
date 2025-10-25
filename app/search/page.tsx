// This is a server component (default in app router)
import { Metadata } from "next";
import SearchPageClient from "./components/SearchPageClient";

interface SearchPageProps {
  searchParams: { q?: string; type?: string; sports?: string };
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const query = searchParams.q || "";
  const type = searchParams.type || "all";

  // Build canonical URL - always point to base search page
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wns-community.com';
  const canonicalUrl = `${baseUrl}/search`;

  return {
    title: `Suchergebnisse für "${query}"`,
    description: `Suchergebnisse für "${query}" in ${type === "all" ? "allen Kategorien" : type}`,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: false, // Don't index search results pages
      follow: true,
    },
    openGraph: {
      title: `Suchergebnisse für "${query}"`,
      description: `Suchergebnisse für "${query}" in ${type === "all" ? "allen Kategorien" : type}`,
      url: canonicalUrl,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `Suchergebnisse für "${query}"`,
      description: `Suchergebnisse für "${query}" in ${type === "all" ? "allen Kategorien" : type}`,
    },
  };
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || "";
  const type = searchParams.type || "all";
  const sports = searchParams.sports?.split(',') || [];
  
  return (
    <SearchPageClient 
      initialQuery={query} 
      initialType={type}
      initialSports={sports}
    />
  );
} 