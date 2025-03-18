"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Loader2, User, Users, Calendar, MapPin, MessageSquare } from "lucide-react";
import { useSearch } from "@/hooks/useSearch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Define the Post type with any possible property
interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
  groupId?: string; // Make this optional to handle both group posts and regular posts
}

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
          className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-10 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white/80 backdrop-blur-sm text-sm"
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
        <Card className="absolute top-full mt-1 w-full z-50 max-h-[80vh] overflow-auto shadow-lg border border-gray-100">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center p-6">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : hasResults ? (
              <div>
                {/* Users */}
                {searchResults.users && searchResults.users.length > 0 && (
                  <div className="p-2 border-b border-gray-100">
                    <h3 className="font-medium text-xs text-gray-500 mb-2 px-2 uppercase tracking-wider flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      Nutzer
                    </h3>
                    <div>
                      {searchResults.users.map((user) => (
                        <Link
                          key={user.id}
                          href={`/profile/${user.id}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center px-2 py-1.5 hover:bg-gray-50 rounded-md"
                        >
                          <Avatar className="h-8 w-8 mr-2">
                            {user.image ? (
                              <AvatarImage src={user.image} alt={user.name || "Nutzer"} />
                            ) : (
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {user.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="overflow-hidden">
                            <p className="font-medium text-sm truncate">{user.name}</p>
                            {user.location && (
                              <p className="text-xs text-gray-500 truncate">{user.location}</p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Groups */}
                {searchResults.groups && searchResults.groups.length > 0 && (
                  <div className="p-2 border-b border-gray-100">
                    <h3 className="font-medium text-xs text-gray-500 mb-2 px-2 uppercase tracking-wider flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      Gruppen
                    </h3>
                    <div>
                      {searchResults.groups.map((group) => (
                        <Link
                          key={group.id}
                          href={`/groups/${group.id}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center px-2 py-1.5 hover:bg-gray-50 rounded-md"
                        >
                          <Avatar className="h-8 w-8 mr-2">
                            {group.image ? (
                              <AvatarImage src={group.image} alt={group.name} />
                            ) : (
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {group.name.charAt(0)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="overflow-hidden">
                            <p className="font-medium text-sm truncate">{group.name}</p>
                            <p className="text-xs text-gray-500 truncate">
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
                  <div className="p-2 border-b border-gray-100">
                    <h3 className="font-medium text-xs text-gray-500 mb-2 px-2 uppercase tracking-wider flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Veranstaltungen
                    </h3>
                    <div>
                      {searchResults.events.map((event) => (
                        <Link
                          key={event.id}
                          href={`/events/${event.id}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center px-2 py-1.5 hover:bg-gray-50 rounded-md"
                        >
                          <Avatar className="h-8 w-8 mr-2">
                            {event.image ? (
                              <AvatarImage src={event.image} alt={event.title} />
                            ) : (
                              <AvatarFallback className="bg-green-100 text-green-600">
                                <Calendar className="h-4 w-4" />
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="overflow-hidden">
                            <p className="font-medium text-sm truncate">{event.title}</p>
                            <p className="text-xs text-gray-500 truncate">
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
                  <div className="p-2 border-b border-gray-100">
                    <h3 className="font-medium text-xs text-gray-500 mb-2 px-2 uppercase tracking-wider flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      Orte
                    </h3>
                    <div>
                      {searchResults.locations.map((location) => (
                        <Link
                          key={location.id}
                          href={`/locations/${location.id}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center px-2 py-1.5 hover:bg-gray-50 rounded-md"
                        >
                          <Avatar className="h-8 w-8 mr-2">
                            {location.images[0] ? (
                              <AvatarImage src={location.images[0]} alt={location.name} />
                            ) : (
                              <AvatarFallback className="bg-green-100 text-green-600">
                                <MapPin className="h-4 w-4" />
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="overflow-hidden">
                            <p className="font-medium text-sm truncate">{location.name}</p>
                            <p className="text-xs text-gray-500 truncate">
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
                  <div className="p-2">
                    <h3 className="font-medium text-xs text-gray-500 mb-2 px-2 uppercase tracking-wider flex items-center">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Beiträge
                    </h3>
                    <div>
                      {searchResults.posts.map((post) => (
                        <Link
                          key={post.id}
                          href={`/posts/${post.id}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center px-2 py-1.5 hover:bg-gray-50 rounded-md"
                        >
                          <Avatar className="h-8 w-8 mr-2">
                            {post.author.image ? (
                              <AvatarImage src={post.author.image} alt={post.author.name || ""} />
                            ) : (
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {post.author.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="overflow-hidden">
                            <p className="font-medium text-sm truncate">{post.title}</p>
                            <p className="text-xs text-gray-500 truncate">
                              Von {post.author.name} • {new Date(post.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : searchTerm ? (
              <div className="p-6 text-center text-gray-500">
                <p>Keine Ergebnisse für &quot;{searchTerm}&quot;</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="mt-2 text-blue-600"
                  onClick={() => {
                    setIsOpen(false);
                    router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
                  }}
                >
                  Erweiterte Suche
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 