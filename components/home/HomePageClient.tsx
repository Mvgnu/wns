'use client';
// Mark this as a client component

import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { sportsCategories } from '@/lib/sportsData';
import { Sport } from '@/lib/sportsData';
import { Badge } from '@/components/ui/badge';
import type { PersonalizedHomeContent } from '@/lib/recommendations/engine';
import { Calendar, Users, MapPin, Clock, Flame, Sparkles, TrendingUp } from 'lucide-react';

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
  personalizedContent: PersonalizedHomeContent;
}

// This is a client component that renders the page UI with pre-fetched data
export default function HomePageClient({
  sportsByCategory,
  groupsCount,
  locationsCount,
  usersCount,
  categoryHighlights,
  sportImages,
  personalizedContent
}: HomePageClientProps) {
  const { data: session } = useSession();

  const formatDateTime = (iso: string) => {
    try {
      return new Intl.DateTimeFormat('de-DE', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      }).format(new Date(iso));
    } catch (error) {
      console.error('Failed to format date', error);
      return iso;
    }
  };

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
      <section className="relative bg-gradient-to-br from-indigo-600 via-blue-700 to-blue-800 text-white py-24 overflow-hidden">
        {/* Abstract shapes for visual interest */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500 opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-400 opacity-10 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 z-10 relative">
          <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="max-w-3xl">
              <div className="flex space-x-2 mb-6">
                <Badge className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 px-3 py-1">
                  Neu
                </Badge>
                <Badge className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 px-3 py-1">
                  Community
                </Badge>
                <Badge className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 px-3 py-1">
                  Sport
                </Badge>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Entdecke deine <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">Sport-Community</span>
            </h1>
              
              <p className="text-xl md:text-2xl mb-8 text-blue-100 font-light leading-relaxed">
                Vernetze dich mit Gleichgesinnten und teile deine Leidenschaft für Sport.
              </p>
              
              <div className="flex flex-wrap gap-y-3 gap-x-6 items-center mb-8">
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <Users className="w-5 h-5 mr-2 text-blue-200" />
                  <span className="font-semibold text-white">{usersCount}+ Mitglieder</span>
                </div>
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <MapPin className="w-5 h-5 mr-2 text-blue-200" />
                  <span className="font-semibold text-white">{locationsCount}+ Orte</span>
                </div>
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <Calendar className="w-5 h-5 mr-2 text-blue-200" />
                  <span className="font-semibold text-white">{groupsCount}+ Gruppen</span>
                </div>
              </div>
              
            <div className="flex flex-col sm:flex-row gap-4">
              {!session ? (
                  <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all" asChild>
                    <Link href="/auth/signup">Jetzt beitreten</Link>
                </Button>
              ) : (
                  <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all" asChild>
                  <Link href="/search">Entdecken</Link>
                </Button>
              )}
                <Button variant="outline" size="lg" className="bg-transparent border-white/50 text-white hover:bg-white/10 hover:border-white" asChild>
                <Link href="/locations">Orte entdecken</Link>
              </Button>
              </div>
            </div>
            
            {/* Right side design element */}
            <div className="hidden md:block relative w-96 h-96 mt-8 md:mt-0">
              <div className="absolute inset-0 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 shadow-xl"></div>
              <div className="absolute inset-12 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 shadow-xl"></div>
              <div className="absolute inset-24 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 shadow-xl"></div>
              <div className="absolute inset-36 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl flex items-center justify-center">
                <div className="text-white text-opacity-90 text-center">
                  <div className="font-bold text-xl mb-1">Sport verbindet</div>
                  <div className="text-sm text-blue-100">Finde deine Gemeinschaft</div>
                </div>
              </div>
              
              {/* Animated dot indicators */}
              <div className="absolute w-4 h-4 rounded-full bg-blue-300 animate-ping" style={{ top: '15%', left: '20%', animationDelay: '0s', animationDuration: '3s' }}></div>
              <div className="absolute w-3 h-3 rounded-full bg-indigo-300 animate-ping" style={{ top: '70%', left: '30%', animationDelay: '0.5s', animationDuration: '2.7s' }}></div>
              <div className="absolute w-3 h-3 rounded-full bg-blue-200 animate-ping" style={{ top: '30%', right: '20%', animationDelay: '1s', animationDuration: '3.5s' }}></div>
              <div className="absolute w-2 h-2 rounded-full bg-indigo-200 animate-ping" style={{ bottom: '15%', right: '35%', animationDelay: '1.5s', animationDuration: '2.5s' }}></div>
            </div>
          </div>
        </div>
        
        <div className="absolute inset-0 bg-black opacity-10"></div>
      </section>

      {/* Personalized Spotlight */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <Badge className="bg-blue-100 text-blue-700 flex items-center gap-2 px-4 py-2">
                {personalizedContent.mode === 'personalized' ? (
                  <>
                    <Sparkles className="h-4 w-4" /> Für dich zusammengestellt
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4" /> Trendende Highlights
                  </>
                )}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mt-4 text-gray-900">
                {personalizedContent.mode === 'personalized'
                  ? 'Deine nächsten Schritte in der Community'
                  : 'Was gerade angesagt ist'}
              </h2>
              <p className="text-gray-600 mt-4 max-w-2xl">
                Wir kombinieren deine Interessen mit aktiven Gruppen und Events, damit du schnell Anschluss findest.
              </p>
              {!session?.user && personalizedContent.mode === 'trending' && (
                <p className="text-sm text-blue-600 mt-2">
                  Melde dich an, um maßgeschneiderte Empfehlungen zu erhalten.
                </p>
              )}
            </div>
            {personalizedContent.spotlightSports.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {personalizedContent.spotlightSports.map((spot) => (
                  <div key={`${spot.source}-${spot.sport}`} className="rounded-full bg-white shadow-sm border border-blue-100 px-4 py-2 flex items-center gap-2">
                    <Flame className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-gray-900">{spot.sport}</span>
                    <span className="text-xs uppercase tracking-wide text-blue-500">{spot.source}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-10">
            <Card className="shadow-lg border-blue-100">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">Empfohlene Gruppen</CardTitle>
                  <Badge variant="outline" className="border-blue-200 text-blue-700">
                    {personalizedContent.groups.length > 0 ? `${personalizedContent.groups.length} Vorschläge` : 'Noch keine Daten'}
                  </Badge>
                </div>
                <CardDescription>
                  {personalizedContent.mode === 'personalized'
                    ? 'Basierend auf deinen Vorlieben und Aktivitäten'
                    : 'Beliebte Gruppen in der Community'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {personalizedContent.groups.length === 0 && (
                  <div className="text-muted-foreground text-sm">
                    Aktualisiere dein Profil mit Interessen, um personalisierte Empfehlungen zu erhalten.
                  </div>
                )}
                {personalizedContent.groups.slice(0, 4).map((group) => (
                  <div key={group.id} className="p-4 rounded-lg border border-blue-100 bg-blue-50/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">{group.description ?? 'Beschreibung folgt bald.'}</p>
                      </div>
                      <Badge className="bg-blue-600 text-white">{group.sport}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1"><Users className="h-4 w-4" />{group.memberCount} Mitglieder</span>
                      <span className="flex items-center gap-1"><Sparkles className="h-4 w-4" />Score {Math.round(group.score)}</span>
                    </div>
                    {group.reasons.length > 0 && (
                      <ul className="mt-3 space-y-1 text-sm text-gray-500">
                        {group.reasons.slice(0, 2).map((reason, index) => (
                          <li key={`${group.id}-reason-${index}`}>• {reason}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-lg border-blue-100">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">Empfohlene Events</CardTitle>
                  <Badge variant="outline" className="border-blue-200 text-blue-700">
                    {personalizedContent.events.length > 0 ? `${personalizedContent.events.length} Vorschläge` : 'Noch keine Daten'}
                  </Badge>
                </div>
                <CardDescription>
                  Nimm an Aktivitäten teil, die zu deinen Interessen und deiner Region passen.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {personalizedContent.events.length === 0 && (
                  <div className="text-muted-foreground text-sm">
                    Sobald Gruppen in deiner Nähe Events planen, erscheinen sie hier automatisch.
                  </div>
                )}
                {personalizedContent.events.slice(0, 4).map((event) => (
                  <div key={event.id} className="p-4 rounded-lg border border-blue-100 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{event.groupName ?? 'Community Event'}</p>
                      </div>
                      {event.sport && (
                        <Badge className="bg-indigo-600 text-white">{event.sport}</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2"><Calendar className="h-4 w-4" />{formatDateTime(event.startTime)}</div>
                      {(event.city || event.state) && (
                        <div className="flex items-center gap-2"><MapPin className="h-4 w-4" />{[event.city, event.state].filter(Boolean).join(', ')}</div>
                      )}
                      <div className="flex items-center gap-2"><Flame className="h-4 w-4" />Score {Math.round(event.score)}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Sports Categories Sections */}
      {sportsCategories.map((category, index) => (
        <section key={category} className={`py-20 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} relative overflow-hidden`}>
          {/* Background design elements */}
          {index % 2 === 0 ? (
            <>
              <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-100 opacity-30 rounded-full"></div>
              <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-100 opacity-30 rounded-full"></div>
            </>
          ) : (
            <>
              <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-100 opacity-30 rounded-full"></div>
              <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-blue-100 opacity-30 rounded-full"></div>
            </>
          )}
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start mb-12">
              <div className="max-w-2xl">
                <div className="inline-block bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-sm font-medium mb-4">
                  {category}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Entdecke {category}</h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Tauche ein in die vielfältige Welt des {category.toLowerCase()}s.
                  Finde Gleichgesinnte, entdecke neue Orte und erlebe gemeinsame Aktivitäten.
                </p>
              </div>
              
              <Button variant="outline" className="mt-6 md:mt-0 border-blue-200 text-blue-700 hover:bg-blue-50 group" asChild>
                <Link href={`/search?category=${encodeURIComponent(category)}`}>
                  Alle in {category} anzeigen
                  <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sportsByCategory[category]?.map((sport) => {
                // Safely get the highlight for this sport
                const highlights = findSportHighlight(category, sport.value);
                const imageUrl = `/images/sports/sport-${sport.value}.jpg`;

                return (
                  <Card key={sport.value} className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 ring-1 ring-gray-200">
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={imageUrl}
                        alt={sport.label}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-xl font-bold text-white">{sport.label}</h3>
                        <p className="text-sm text-blue-100 line-clamp-2">{sport.description}</p>
                      </div>
                    </div>
                    
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap gap-2">
                        {highlights?.topGroup && (
                          <Badge variant="secondary" className="flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100">
                            <Users className="w-3 h-3" />
                            {highlights.topGroup._count.members} Mitglieder
                          </Badge>
                        )}
                        {highlights?.upcomingEvent && (
                          <Badge variant="secondary" className="flex items-center gap-1 bg-green-50 text-green-700 hover:bg-green-100">
                            <Calendar className="w-3 h-3" />
                            Nächstes Event
                          </Badge>
                        )}
                  </div>
                  </CardHeader>
                  
                    <div className="px-4 space-y-3 pb-3">
                      {highlights?.topGroup && (
                        <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors">
                          <div className="flex items-center mb-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                            <p className="font-medium text-sm text-blue-700">Top Gruppe</p>
                          </div>
                          <p className="text-sm text-blue-800 truncate">{highlights.topGroup.name}</p>
                        </div>
                      )}
                      
                      {highlights?.upcomingEvent && (
                        <div className="p-3 bg-green-50/50 border border-green-100 rounded-lg hover:bg-green-50 transition-colors">
                          <div className="flex items-center mb-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                            <p className="font-medium text-sm text-green-700">Nächstes Event</p>
                          </div>
                          <p className="text-sm text-green-800 truncate">{highlights.upcomingEvent.title}</p>
                          <p className="text-xs text-green-700 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {new Date(highlights.upcomingEvent.startTime).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <CardFooter className="pt-0">
                      <Button variant="ghost" className="w-full hover:bg-blue-50 hover:text-blue-700 group" asChild>
                        <Link href={`/search?q=${encodeURIComponent(sport.label)}&sports=${encodeURIComponent(sport.value)}`}>
                          {sport.label} entdecken
                          <span className="ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</span>
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
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
        <div className="absolute -top-64 -right-64 w-[500px] h-[500px] bg-blue-50 rounded-full opacity-50"></div>
        <div className="absolute -bottom-64 -left-64 w-[500px] h-[500px] bg-indigo-50 rounded-full opacity-50"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-block bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-sm font-medium mb-4">
              Warum WNS?
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900">
              Die Plattform für deine <span className="text-blue-600">sportliche Vernetzung</span>
            </h2>
            <p className="text-gray-600 text-lg">
              WNS ist deine zentrale Anlaufstelle für Sport und Community. Hier findest du alles, 
              was du brauchst, um deine sportlichen Ziele zu erreichen und neue Kontakte zu knüpfen.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
              {/* Decorative shape */}
              <div className="absolute -right-12 -top-12 w-32 h-32 bg-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10">
                <div className="bg-blue-50 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Aktive Community</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Finde Gleichgesinnte in deiner Region und werde Teil einer lebendigen Sport-Community. Teile deine Erfahrungen und profitiere vom Wissen anderer.
                </p>
                <div className="flex space-x-3">
                  <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100">Vernetzung</Badge>
                  <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100">Freundschaften</Badge>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
              {/* Decorative shape */}
              <div className="absolute -right-12 -top-12 w-32 h-32 bg-indigo-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10">
                <div className="bg-indigo-50 text-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <MapPin className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Entdecke Orte</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Finde die besten Spots für deine Lieblingssportarten und teile deine Entdeckungen. Von versteckten Trails bis zu urbanen Sportplätzen.
                </p>
                <div className="flex space-x-3">
                  <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100">Locations</Badge>
                  <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100">Geheimtipps</Badge>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
              {/* Decorative shape */}
              <div className="absolute -right-12 -top-12 w-32 h-32 bg-green-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10">
                <div className="bg-green-50 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Calendar className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Events & Aktivitäten</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Nimm an lokalen Events teil oder organisiere selbst Treffen mit Gleichgesinnten. Von wöchentlichen Trainings bis zu größeren Veranstaltungen.
                </p>
                <div className="flex space-x-3">
                  <Badge className="bg-green-50 text-green-700 hover:bg-green-100">Events</Badge>
                  <Badge className="bg-green-50 text-green-700 hover:bg-green-100">Aktivitäten</Badge>
                </div>
              </div>
            </div>
          </div>
          
          {/* Testimonial/Stats bar */}
          <div className="mt-20 bg-gradient-to-r from-blue-50 via-white to-indigo-50 rounded-xl p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">{usersCount}+</div>
                <div className="text-gray-600">Aktive Mitglieder</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-indigo-600 mb-2">{locationsCount}+</div>
                <div className="text-gray-600">Entdeckte Orte</div>
            </div>
            <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">{groupsCount}+</div>
                <div className="text-gray-600">Sport-Gruppen</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden relative">
        {/* Decorative elements */}
        <div className="absolute -top-96 -left-96 w-[800px] h-[800px] bg-indigo-500 opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-96 -right-96 w-[800px] h-[800px] bg-blue-500 opacity-20 rounded-full blur-3xl"></div>
        
        {/* Semi-transparent pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          backgroundSize: '24px 24px'
        }}></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full text-white text-sm font-medium mb-4">
                Werde Teil unserer Community
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Bereit, deine Sport-Community zu finden?
              </h2>
              <p className="text-xl mb-10 max-w-2xl mx-auto text-blue-100 font-light leading-relaxed">
                Werde Teil unserer wachsenden Community und entdecke neue Möglichkeiten für deine sportlichen Aktivitäten.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all group" asChild>
                  <Link href="/auth/signup">
                    Jetzt registrieren
                    <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="bg-transparent border-white/50 text-white hover:bg-white/10" asChild>
                  <Link href="/about">Mehr erfahren</Link>
          </Button>
              </div>
            </div>
            
            {/* Feature highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-colors">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mr-4">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-lg">Verbinde dich</h3>
                </div>
                <p className="text-blue-100 text-sm">Knüpfe neue Kontakte mit Sportbegeisterten in deiner Nähe und erweitere dein Netzwerk.</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-colors">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mr-4">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-lg">Sei dabei</h3>
                </div>
                <p className="text-blue-100 text-sm">Nimm an Events und regelmäßigen Treffen teil, die perfekt zu deinen sportlichen Interessen passen.</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-colors">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mr-4">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-lg">Entdecke Orte</h3>
                </div>
                <p className="text-blue-100 text-sm">Finde die besten Locations für deine Sportart und teile deine eigenen Geheimtipps.</p>
              </div>
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-10 mt-16">
              <div className="text-blue-100 text-sm font-light flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                Datenschutz-konform
              </div>
              <div className="text-blue-100 text-sm font-light flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                Made in Germany
              </div>
              <div className="text-blue-100 text-sm font-light flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                Kostenfreie Basis-Mitgliedschaft
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 