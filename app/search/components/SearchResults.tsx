"use client";

import Link from "next/link";
import Image from "next/image";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow, format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Lock, Unlock } from "lucide-react";

interface SearchResultsProps {
  results: any;
  type: string;
  query: string;
}

export default function SearchResults({ results, type, query }: SearchResultsProps) {
  // Handle null results
  if (!results) {
    if (query) {
      return (
        <div className="py-8 text-center">
          <p className="text-gray-500 mb-2">Keine Ergebnisse gefunden</p>
          <p className="text-sm text-gray-400">Versuche es mit einem anderen Suchbegriff oder anderen Filtern</p>
        </div>
      );
    }
    return null;
  }

  // Check if there are any results
  const hasResults = 
    (results.users?.length > 0) ||
    (results.groups?.length > 0) ||
    (results.events?.length > 0) ||
    (results.locations?.length > 0);

  if (!hasResults) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500 mb-2">Keine Ergebnisse gefunden</p>
        <p className="text-sm text-gray-400">Versuche es mit einem anderen Suchbegriff oder anderen Filtern</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Users */}
      {(type === "all" || type === "users") && results.users && results.users.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Nutzer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.users.map((user: any) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar className="h-10 w-10 relative">
                    {user.image && (
                      <Image
                        src={user.image}
                        alt={user.name || "User"}
                        fill
                        sizes="40px"
                        className="object-cover rounded-full"
                      />
                    )}
                  </Avatar>
                  <div>
                    <CardTitle>{user.name}</CardTitle>
                    {user.location && <CardDescription>{user.location}</CardDescription>}
                  </div>
                </CardHeader>
                <CardContent>
                  {user.sports && user.sports.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {user.sports.map((sport: string) => (
                        <Badge key={sport} variant="secondary">
                          {sport}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Link
                    href={`/profile/${user.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Profil anzeigen
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Groups */}
      {(type === "all" || type === "groups") && results.groups && results.groups.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Gruppen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.groups.map((group: any) => (
              <Card key={group.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="h-40 w-full overflow-hidden rounded-md mb-2 relative">
                    {group.image ? (
                      <Image 
                        src={group.image} 
                        alt={group.name} 
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-500 font-medium">{group.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <CardTitle>{group.name}</CardTitle>
                    {group.isPrivate ? (
                      <Lock className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Unlock className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                  <CardDescription>
                    <Badge variant="secondary" className="mr-2">
                      {group.sport}
                    </Badge>
                    <span className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-1" />
                      {group._count.members} Mitglieder
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {group.description && (
                    <p className="text-gray-600 line-clamp-3">{group.description}</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Link
                    href={`/groups/${group.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Gruppe anzeigen
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Events */}
      {(type === "all" || type === "events") && results.events && results.events.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.events.map((event: any) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="h-40 w-full overflow-hidden rounded-md mb-2 relative">
                    {event.image ? (
                      <Image 
                        src={event.image} 
                        alt={event.title} 
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-500 font-medium">{event.title}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <CardTitle>{event.title}</CardTitle>
                    {event.group?.isPrivate && (
                      <Lock className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                  <CardDescription>
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      {format(new Date(event.startTime), "PPP")}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-1" />
                      {event.location?.name || "Kein Ort angegeben"}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {event.description && (
                    <p className="text-gray-600 line-clamp-3">{event.description}</p>
                  )}
                  {event.group && (
                    <div className="flex items-center mt-2">
                      <Badge variant="secondary">
                        {event.group.sport}
                      </Badge>
                      <span className="text-sm text-gray-500 ml-2">
                        von {event.group.name}
                      </span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Link
                    href={`/events/${event.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Event anzeigen
                  </Link>
                  <span className="flex items-center text-sm text-gray-500">
                    <Users className="h-4 w-4 mr-1" />
                    {event._count.attendees} Teilnehmer
                  </span>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Locations */}
      {(type === "all" || type === "locations") && results.locations && results.locations.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Orte</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.locations.map((location: any) => (
              <Card key={location.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="h-40 w-full overflow-hidden rounded-md mb-2 relative">
                    {location.images && location.images.length > 0 ? (
                      <Image 
                        src={location.images[0]} 
                        alt={location.name} 
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-500 font-medium">{location.name}</span>
                      </div>
                    )}
                  </div>
                  <CardTitle>{location.name}</CardTitle>
                  <CardDescription>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {location.type}
                      </Badge>
                      <Badge variant="secondary">
                        {location.sport}
                      </Badge>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {location.description && (
                    <p className="text-gray-600 line-clamp-3">{location.description}</p>
                  )}
                  {location.address && (
                    <div className="flex items-center text-sm text-gray-500 mt-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      {location.address}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Link
                    href={`/locations/${location.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Ort anzeigen
                  </Link>
                  <span className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    {location._count.events} Events
                  </span>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 