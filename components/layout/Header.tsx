"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SearchBar from "./SearchBar";
import NotificationsDropdown from "./NotificationsDropdown";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Home, Users, MapPin, Calendar, Settings, LogOut, User as UserIcon, Menu } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: "Startseite", href: "/", icon: Home },
    { name: "Gruppen", href: "/groups", icon: Users },
    { name: "Orte", href: "/locations", icon: MapPin },
    { name: "Veranstaltungen", href: "/events", icon: Calendar },
  ];

  // Calendar nav item only for authenticated users
  const authenticatedNavItems = session ? [
    ...navItems,
    { name: "Kalender", href: "/events/calendar", icon: Calendar },
  ] : navItems;

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile menu button only */}
          <div className="md:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-2 text-gray-700">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetHeader className="border-b pb-4 mb-4">
                  <SheetTitle className="text-left flex items-center">
                    <span className="bg-blue-600 text-white h-8 w-8 rounded-md flex items-center justify-center mr-2 text-xl">W</span>
                    WNS Community
                  </SheetTitle>
                </SheetHeader>
                
                {session?.user && (
                  <div className="flex items-center space-x-4 mb-6 pb-6 border-b">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                      <AvatarFallback className="bg-blue-100 text-blue-600">{session.user.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{session.user.name}</p>
                      <p className="text-sm text-gray-500">{session.user.email}</p>
                    </div>
                  </div>
                )}
                
                {/* Simplified menu content */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-gray-500 px-2">Navigation</h3>
                    {authenticatedNavItems.map((item) => (
                      <Link 
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-2 py-2 text-sm rounded-md ${
                          pathname === item.href 
                            ? "bg-blue-50 text-blue-600 font-medium" 
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          <Link href="/" className="text-2xl font-bold text-blue-600 flex items-center">
            <span className="bg-blue-600 text-white h-8 w-8 rounded-md flex items-center justify-center mr-2 text-xl">W</span>
            <span className="hidden sm:inline">WNS Community</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {authenticatedNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                  pathname === item.href
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Search Bar - Hidden on mobile */}
        <div className="hidden md:block max-w-md flex-1 mx-6">
          <SearchBar />
        </div>

        <div className="flex items-center space-x-4">
          {isLoading ? (
            <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse" />
          ) : session ? (
            <>
              {/* Notifications Dropdown */}
              <NotificationsDropdown />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 overflow-hidden border border-gray-200">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user?.image || ""} alt={session.user?.name || "Benutzer"} />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {session.user?.name
                          ? session.user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                          : "B"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.user?.name}</p>
                      <p className="text-xs leading-none text-gray-500">{session.user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${session.user?.id}`} className="flex items-center">
                      <UserIcon className="mr-2 h-4 w-4" />
                      Profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Einstellungen
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer flex items-center text-red-600"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Abmelden
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="font-medium" asChild>
                <Link href="/auth/signin">Anmelden</Link>
              </Button>
              <Button size="sm" className="font-medium" asChild>
                <Link href="/auth/signup">Registrieren</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Search Bar - Only visible on mobile */}
      <div className="md:hidden px-4 pb-3">
        <SearchBar />
      </div>
    </header>
  );
};

export default Header; 