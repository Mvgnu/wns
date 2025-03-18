'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Home, 
  Search, 
  Calendar, 
  Users, 
  Map, 
  Menu, 
  X, 
  LogIn, 
  User, 
  Settings, 
  Bell, 
  LogOut,
  CalendarDays
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetClose
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export default function MobileNavigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Fetch notification count
  useEffect(() => {
    if (session?.user) {
      fetchNotificationCount();
    }
  }, [session]);

  const fetchNotificationCount = async () => {
    try {
      const response = await fetch('/api/notifications/count');
      if (response.ok) {
        const data = await response.json();
        setNotificationCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  const mainNavItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/search', label: 'Entdecken', icon: Search },
    { href: '/events', label: 'Events', icon: Calendar },
    { href: '/groups', label: 'Gruppen', icon: Users },
    { href: '/locations', label: 'Locations', icon: Map },
  ];

  const userNavItems = session ? [
    { href: `/profile/${session.user.id}`, label: 'Profil', icon: User },
    { href: '/notifications', label: 'Benachrichtigungen', icon: Bell, count: notificationCount },
    { href: '/settings', label: 'Einstellungen', icon: Settings },
  ] : [
    { href: '/auth/signin', label: 'Anmelden', icon: LogIn },
  ];

  return (
    <>
      {/* Calendar floating button for logged-in users */}
      {session?.user && (
        <div className="md:hidden fixed bottom-20 right-4 z-50">
          <Link href="/events/calendar">
            <Button 
              size="icon" 
              className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-white"
              aria-label="Calendar"
            >
              <CalendarDays className="h-6 w-6" />
            </Button>
          </Link>
        </div>
      )}

      {/* Bottom mobile navigation bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16">
          {mainNavItems.slice(0, 5).map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full text-xs",
                pathname === item.href ? "text-primary" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile menu button in header */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <SheetHeader className="border-b pb-4 mb-4">
              <SheetTitle className="text-left">Menu</SheetTitle>
            </SheetHeader>
            
            {session?.user && (
              <div className="flex items-center space-x-4 mb-6 pb-6 border-b">
                <Avatar>
                  <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                  <AvatarFallback>{session.user.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{session.user.name}</p>
                  <p className="text-sm text-gray-500">{session.user.email}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-500 px-2">Navigation</h3>
                {mainNavItems.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link 
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-2 py-2 text-sm rounded-md",
                        pathname === item.href 
                          ? "bg-primary/10 text-primary font-medium" 
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
                
                {session?.user && (
                  <SheetClose asChild>
                    <Link 
                      href="/events/calendar"
                      className={cn(
                        "flex items-center gap-3 px-2 py-2 text-sm rounded-md",
                        pathname === "/events/calendar" 
                          ? "bg-primary/10 text-primary font-medium" 
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <CalendarDays className="h-5 w-5" />
                      Kalender
                    </Link>
                  </SheetClose>
                )}
              </div>
              
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-500 px-2">Konto</h3>
                {userNavItems.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link 
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-2 py-2 text-sm rounded-md",
                        pathname === item.href 
                          ? "bg-primary/10 text-primary font-medium" 
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                      {item.count ? (
                        <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                          {item.count}
                        </span>
                      ) : null}
                    </Link>
                  </SheetClose>
                ))}
                
                {session?.user && (
                  <SheetClose asChild>
                    <Link 
                      href="/api/auth/signout"
                      className="flex items-center gap-3 px-2 py-2 text-sm rounded-md text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-5 w-5" />
                      Abmelden
                    </Link>
                  </SheetClose>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
} 