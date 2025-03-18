'use client';
// Mark this as a client component

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { sportsCategories } from '@/lib/sportsData';
import { Sport } from '@/lib/sportsData';
import GroupRecommendations from '@/components/groups/GroupRecommendations';

// Type definitions for our props
interface HomePageClientProps {
  sportsByCategory: Record<string, Sport[]>;
  groupsCount: number;
  locationsCount: number;
  usersCount: number;
  categoryHighlights: Record<string, {
    topGroup: {
      id: string;
      name: string;
      _count: {
        members: number;
      };
      [key: string]: any;
    } | null;
    upcomingEvent: {
      id: string;
      title: string;
      startTime: string;
      group: any;
      [key: string]: any;
    } | null;
  }>;
}

// This is a client component that renders the page UI with pre-fetched data
export default function HomePageClient({
  sportsByCategory,
  groupsCount,
  locationsCount,
  usersCount,
  categoryHighlights
}: HomePageClientProps) {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-blue-600 text-white py-20">
        <div className="container mx-auto px-4 z-10 relative">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Vernetze dich mit Gleichgesinnten Sportlern!
            </h1>
            <p className="text-xl mb-8">
              Werde Teil unserer lebendigen Community von {usersCount}+ Sportlern, die {groupsCount}+ Gruppen bilden und {locationsCount}+ Orte teilen. Entdecke neue Spots und knüpfe Kontakte zu Gleichgesinnten in deiner Umgebung.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {!session ? (
                <Button size="lg" asChild>
                  <Link href="/auth/signup">Der Community beitreten</Link>
                </Button>
              ) : (
                <Button size="lg" asChild>
                  <Link href="/search">Entdecken</Link>
                </Button>
              )}
              <Button variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600" asChild>
                <Link href="/locations">Orte entdecken</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-black opacity-30"></div>
      </section>

      {/* Group Recommendations for logged in users */}
      {session?.user && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <GroupRecommendations />
          </div>
        </section>
      )}

      {/* Sports Categories Sections */}
      {sportsCategories.map((category) => (
        <section key={category} className="py-16 even:bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">{category}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sportsByCategory[category]?.slice(0, 3).map((sport) => (
                <Card key={sport.value} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <span className="text-white text-xl font-semibold">{sport.label}</span>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle>{sport.label}</CardTitle>
                    <CardDescription>{sport.description}</CardDescription>
                  </CardHeader>
                  
                  {/* Show top group or event if available */}
                  {(categoryHighlights[category]?.topGroup || categoryHighlights[category]?.upcomingEvent) && (
                    <div className="p-4 pt-0">
                      {categoryHighlights[category]?.topGroup && (
                        <div className="mb-2 p-3 bg-blue-50 rounded-md">
                          <p className="font-medium text-sm">Top Gruppe:</p>
                          <p className="text-sm flex justify-between">
                            <span className="truncate mr-2">{categoryHighlights[category].topGroup.name}</span>
                            <span className="whitespace-nowrap text-blue-600">
                              {categoryHighlights[category].topGroup._count.members} Mitglieder
                            </span>
                          </p>
                        </div>
                      )}
                      
                      {categoryHighlights[category]?.upcomingEvent && (
                        <div className="p-3 bg-green-50 rounded-md">
                          <p className="font-medium text-sm">Nächstes Event:</p>
                          <p className="text-sm truncate">{categoryHighlights[category].upcomingEvent.title}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(categoryHighlights[category].upcomingEvent.startTime).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <CardFooter>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/search?q=${encodeURIComponent(sport.label)}&sports=${encodeURIComponent(sport.value)}`}>{sport.label} entdecken</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              
              {sportsByCategory[category]?.length > 3 && (
                <Card className="flex flex-col justify-center items-center bg-gray-50 p-8">
                  <h3 className="text-xl font-bold mb-4">Weitere {sportsByCategory[category].length - 3} Sportarten entdecken</h3>
                  <Button asChild>
                    <Link href={`/search?q=${encodeURIComponent(category)}&type=all`}>Alle {category} ansehen</Link>
                  </Button>
                </Card>
              )}
            </div>
          </div>
        </section>
      ))}

      {/* Community Features */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Community-Funktionen</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Gruppen beitreten</h3>
              <p className="text-gray-600">
                Vernetze dich mit Enthusiasten in deiner Region durch den Beitritt zu sportspezifischen Interessengruppen und lokalen Communities.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Orte entdecken</h3>
              <p className="text-gray-600">
                Finde und teile die besten Spots für deine Lieblingssportarten und -aktivitäten mit einer aktiven Community von Gleichgesinnten.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">An Veranstaltungen teilnehmen</h3>
              <p className="text-gray-600">
                Nimm an lokalen Events, Wettbewerben und Treffen teil, um deine Leidenschaft mit anderen zu teilen und neue Kontakte zu knüpfen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Bereit, unserer Community beizutreten?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Vernetze dich mit Gleichgesinnten, teile deine Erfahrungen und entdecke neue Orte für deine Lieblingssportarten und -aktivitäten.
          </p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100" asChild>
            <Link href="/auth/signup">Jetzt registrieren</Link>
          </Button>
        </div>
      </section>
    </div>
  );
} 