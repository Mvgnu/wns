'use client';
// Mark this as a client component

import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { sportsCategories } from '@/lib/sportsData';
import { Sport } from '@/lib/sportsData';
import GroupRecommendations from '@/components/groups/GroupRecommendations';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, MapPin, Clock } from 'lucide-react';

// Type definitions for our props
interface SportHighlight {
  sport: string;
  label: string;
  description: string;
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
}

interface HomePageClientProps {
  sportsByCategory: Record<string, Sport[]>;
  groupsCount: number;
  locationsCount: number;
  usersCount: number;
  categoryHighlights: Record<string, SportHighlight[]>;
  sportImages: Record<string, string>;
}

// This is a client component that renders the page UI with pre-fetched data
export default function HomePageClient({
  sportsByCategory,
  groupsCount,
  locationsCount,
  usersCount,
  categoryHighlights,
  sportImages
}: HomePageClientProps) {
  const { data: session } = useSession();

  // Helper function to safely find a sport highlight in the category
  const findSportHighlight = (category: string, sportValue: string): SportHighlight | undefined => {
    // Check if the category exists in the highlights
    if (!categoryHighlights || !categoryHighlights[category] || !Array.isArray(categoryHighlights[category])) {
      return undefined;
    }
    
    // Find the highlight for the specific sport
    return categoryHighlights[category].find(highlight => highlight.sport === sportValue);
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white py-24">
        <div className="container mx-auto px-4 z-10 relative">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Entdecke deine Sport-Community
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Vernetze dich mit {usersCount}+ Sportlern, {groupsCount}+ Gruppen und {locationsCount}+ Orten. 
              Finde Gleichgesinnte und teile deine Leidenschaft.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {!session ? (
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50" asChild>
                  <Link href="/auth/signup">Jetzt beitreten</Link>
                </Button>
              ) : (
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50" asChild>
                  <Link href="/search">Entdecken</Link>
                </Button>
              )}
              <Button variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600" asChild>
                <Link href="/locations">Orte entdecken</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-black opacity-20"></div>
      </section>

      {/* Group Recommendations for logged in users */}
      {session?.user && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Empfohlene Gruppen für dich</h2>
            <GroupRecommendations />
          </div>
        </section>
      )}

      {/* Sports Categories Sections */}
      {sportsCategories.map((category) => (
        <section key={category} className="py-16 even:bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-4">{category}</h2>
            <p className="text-gray-600 mb-8 max-w-2xl">
              Entdecke die vielfältige Welt des {category.toLowerCase()}s. 
              Finde Gruppen, Events und Orte, die zu deinen Interessen passen.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sportsByCategory[category]?.map((sport) => {
                // Safely get the highlight for this sport
                const highlights = findSportHighlight(category, sport.value);
                const imageUrl = `/images/sports/sport-${sport.value}.jpg`;

                return (
                  <Card key={sport.value} className="overflow-hidden hover:shadow-lg transition-all duration-300">
                    <div className="relative h-48">
                      <Image
                        src={imageUrl}
                        alt={sport.label}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-xl font-bold text-white">{sport.label}</h3>
                        <p className="text-sm text-blue-100">{sport.description}</p>
                      </div>
                    </div>
                    
                    <CardHeader>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {highlights?.topGroup && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {highlights.topGroup._count.members} Mitglieder
                          </Badge>
                        )}
                        {highlights?.upcomingEvent && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Nächstes Event
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <div className="px-4 space-y-4">
                      {highlights?.topGroup && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="font-medium text-sm text-blue-900">Top Gruppe</p>
                          <p className="text-sm text-blue-800 truncate">{highlights.topGroup.name}</p>
                        </div>
                      )}
                      
                      {highlights?.upcomingEvent && (
                        <div className="p-3 bg-green-50 rounded-lg">
                          <p className="font-medium text-sm text-green-900">Nächstes Event</p>
                          <p className="text-sm text-green-800 truncate">{highlights.upcomingEvent.title}</p>
                          <p className="text-xs text-green-700 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {new Date(highlights.upcomingEvent.startTime).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <CardFooter>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href={`/search?q=${encodeURIComponent(sport.label)}&sports=${encodeURIComponent(sport.value)}`}>
                          {sport.label} entdecken
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      ))}

      {/* Community Features */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Warum WNS?</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            WNS ist deine Plattform für Sport und Community. Hier findest du alles, 
            was du brauchst, um deine sportlichen Ziele zu erreichen und neue Kontakte zu knüpfen.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Aktive Community</h3>
              <p className="text-gray-600">
                Finde Gleichgesinnte in deiner Region und werde Teil einer lebendigen Sport-Community.
              </p>
            </div>
            <div className="text-center p-6 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Entdecke Orte</h3>
              <p className="text-gray-600">
                Finde die besten Spots für deine Lieblingssportarten und teile deine Entdeckungen.
              </p>
            </div>
            <div className="text-center p-6 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Events & Aktivitäten</h3>
              <p className="text-gray-600">
                Nimm an lokalen Events teil oder organisiere selbst Treffen mit Gleichgesinnten.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Bereit, deine Sport-Community zu finden?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-blue-100">
            Werde Teil unserer wachsenden Community und entdecke neue Möglichkeiten für deine sportlichen Aktivitäten.
          </p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50" asChild>
            <Link href="/auth/signup">Jetzt registrieren</Link>
          </Button>
        </div>
      </section>
    </div>
  );
} 