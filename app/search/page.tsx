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
  
  return {
    title: `Suchergebnisse für "${query}"`,
    description: `Suchergebnisse für "${query}" in ${type === "all" ? "allen Kategorien" : type}`,
    robots: {
      index: false, // Don't index search results pages
      follow: true,
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