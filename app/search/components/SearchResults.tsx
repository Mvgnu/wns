"use client";

import Link from "next/link";
import Image from "next/image";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

interface SearchResultsProps {
  results: any;
  type: string;
}

export default function SearchResults({ results, type }: SearchResultsProps) {
  // Check if there are any results
  const hasResults = 
    (results.users && results.users.length > 0) ||
    (results.posts && results.posts.length > 0) ||
    (results.groups && results.groups.length > 0) ||
    (results.events && results.events.length > 0) ||
    (results.locations && results.locations.length > 0);

  if (!hasResults) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500">No results found</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Users */}
      {(type === "all" || type === "users") && results.users && results.users.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Users</h2>
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
                        <span 
                          key={sport} 
                          className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700"
                        >
                          {sport}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Link
                    href={`/profile/${user.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View Profile
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
          <h2 className="text-2xl font-bold mb-4">Groups</h2>
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
                  <CardTitle>{group.name}</CardTitle>
                  <CardDescription>
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 mr-2">
                      {group.sport}
                    </span>
                    {group._count.members} members
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
                    View Group
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
                  <CardTitle>{event.title}</CardTitle>
                  <CardDescription>
                    {new Date(event.startTime).toLocaleDateString()} at {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {event.description && (
                    <p className="text-gray-600 line-clamp-3">{event.description}</p>
                  )}
                  {event.location && (
                    <p className="text-sm text-gray-500 mt-2">
                      📍 {event.location.name}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Link
                    href={`/events/${event.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View Event
                  </Link>
                  <span className="text-sm text-gray-500">
                    {event._count.attendees} attendees
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
          <h2 className="text-2xl font-bold mb-4">Locations</h2>
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
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 mr-2">
                      {location.type}
                    </span>
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                      {location.sport}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {location.description && (
                    <p className="text-gray-600 line-clamp-3">{location.description}</p>
                  )}
                  {location.address && (
                    <p className="text-sm text-gray-500 mt-2">
                      📍 {location.address}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Link
                    href={`/locations/${location.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View Location
                  </Link>
                  {location.rating && (
                    <div className="flex items-center">
                      <span className="text-yellow-500 mr-1">★</span>
                      <span className="text-sm text-gray-500">{location.rating.toFixed(1)}</span>
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Posts */}
      {(type === "all" || type === "posts") && results.posts && results.posts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Posts</h2>
          <div className="space-y-4">
            {results.posts.map((post: any) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 relative">
                      {post.author.image && (
                        <Image
                          src={post.author.image}
                          alt={post.author.name}
                          fill
                          sizes="32px"
                          className="object-cover rounded-full"
                        />
                      )}
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{post.title}</CardTitle>
                      <CardDescription>
                        By {post.author.name} • {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-600 line-clamp-3" dangerouslySetInnerHTML={{ __html: post.content }} />
                  
                  {post.images && post.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {post.images.slice(0, 3).map((image: string, index: number) => (
                        <div key={index} className="relative h-20 rounded-md overflow-hidden">
                          <Image
                            src={image}
                            alt={`Image ${index + 1} for ${post.title}`}
                            fill
                            sizes="(max-width: 768px) 33vw, 100px"
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Link
                    href={`/posts/${post.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Read More
                  </Link>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{post._count.comments} comments</span>
                    <span>{post._count.likes} likes</span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 