"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Loader2 } from "lucide-react";
import { useSearch } from "@/hooks/useSearch";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  const { searchResults, isLoading, handleSearch, searchQuery } = useSearch();

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle input change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch(searchTerm);
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, handleSearch]);

  // Focus input when search is opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const clearSearch = () => {
    setSearchTerm("");
    setIsOpen(false);
  };

  const hasResults = 
    (searchResults.users && searchResults.users.length > 0) ||
    (searchResults.posts && searchResults.posts.length > 0) ||
    (searchResults.groups && searchResults.groups.length > 0) ||
    (searchResults.events && searchResults.events.length > 0) ||
    (searchResults.locations && searchResults.locations.length > 0);

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Suche nach Nutzern, Beiträgen, Gruppen..."
          className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => {
            if (searchTerm.trim()) {
              setIsOpen(true);
            }
          }}
        />
        {searchTerm && (
          <button 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <Card className="absolute top-full mt-1 w-full z-50 max-h-[80vh] overflow-auto">
          <CardContent className="p-2">
            {isLoading ? (
              <div className="flex justify-center items-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : hasResults ? (
              <div className="space-y-4">
                {/* Users */}
                {searchResults.users && searchResults.users.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 mb-2">Nutzer</h3>
                    <div className="space-y-2">
                      {searchResults.users.map((user) => (
                        <Link
                          key={user.id}
                          href={`/profile/${user.id}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center p-2 hover:bg-gray-100 rounded-md"
                        >
                          <Avatar className="h-8 w-8 mr-2 relative">
                            {user.image && (
                              <Image
                                src={user.image}
                                alt={user.name || "Nutzer"}
                                fill
                                sizes="32px"
                                className="object-cover rounded-full"
                              />
                            )}
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            {user.location && (
                              <p className="text-sm text-gray-500">{user.location}</p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Groups */}
                {searchResults.groups && searchResults.groups.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 mb-2">Gruppen</h3>
                    <div className="space-y-2">
                      {searchResults.groups.map((group) => (
                        <Link
                          key={group.id}
                          href={`/groups/${group.id}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center p-2 hover:bg-gray-100 rounded-md"
                        >
                          <Avatar className="h-8 w-8 mr-2 relative">
                            {group.image && (
                              <Image
                                src={group.image}
                                alt={group.name}
                                fill
                                sizes="32px"
                                className="object-cover rounded-full"
                              />
                            )}
                          </Avatar>
                          <div>
                            <p className="font-medium">{group.name}</p>
                            <p className="text-sm text-gray-500">
                              {group.sport} • {group._count.members} Mitglieder
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Events */}
                {searchResults.events && searchResults.events.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 mb-2">Veranstaltungen</h3>
                    <div className="space-y-2">
                      {searchResults.events.map((event) => (
                        <Link
                          key={event.id}
                          href={`/events/${event.id}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center p-2 hover:bg-gray-100 rounded-md"
                        >
                          <Avatar className="h-8 w-8 mr-2 relative">
                            {event.image && (
                              <Image
                                src={event.image}
                                alt={event.title}
                                fill
                                sizes="32px"
                                className="object-cover rounded-full"
                              />
                            )}
                          </Avatar>
                          <div>
                            <p className="font-medium">{event.title}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(event.startTime).toLocaleDateString()}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Locations */}
                {searchResults.locations && searchResults.locations.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 mb-2">Orte</h3>
                    <div className="space-y-2">
                      {searchResults.locations.map((location) => (
                        <Link
                          key={location.id}
                          href={`/locations/${location.id}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center p-2 hover:bg-gray-100 rounded-md"
                        >
                          <Avatar className="h-8 w-8 mr-2 relative">
                            {location.images[0] && (
                              <Image
                                src={location.images[0]}
                                alt={location.name}
                                fill
                                sizes="32px"
                                className="object-cover rounded-full"
                              />
                            )}
                          </Avatar>
                          <div>
                            <p className="font-medium">{location.name}</p>
                            <p className="text-sm text-gray-500">
                              {location.type} • {location.sport}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Posts */}
                {searchResults.posts && searchResults.posts.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 mb-2">Beiträge</h3>
                    <div className="space-y-2">
                      {searchResults.posts.map((post) => (
                        <Link
                          key={post.id}
                          href={`/posts/${post.id}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center p-2 hover:bg-gray-100 rounded-md"
                        >
                          <div className="w-full">
                            <p className="font-medium">{post.title}</p>
                            <p className="text-sm text-gray-500 truncate">
                              {post.content.replace(/<[^>]*>?/gm, '').slice(0, 60)}...
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* View all results button */}
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => {
                    router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
                    setIsOpen(false);
                  }}
                >
                  Alle Ergebnisse anzeigen
                </Button>
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                Keine Ergebnisse gefunden für "{searchTerm}"
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 