"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, MapPin, Users, Share2, Heart, Edit, Trash2, ChevronLeft, ExternalLink, RefreshCw, Lock, LockOpen, DollarSign, Users2 } from "lucide-react";
import { format, formatDistanceToNow, differenceInMinutes } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';

// Fix for Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon.src,
  shadowUrl: iconShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Define the Event type
interface GroupMember {
  userId: string;
  role: string;
}

interface GroupMemberLegacy {
  id: string;
}

interface EventType {
  id: string;
  title: string;
  description?: string;
  image?: string;
  startTime: string;
  endTime?: string;
  sport?: string;
  isRecurring?: boolean;
  recurringPattern?: string;
  recurringDays?: number[];
  recurringEndDate?: string;
  isPaid?: boolean;
  price?: number;
  priceCurrency?: string;
  priceDescription?: string;
  joinRestriction?: 'everyone' | 'groupOnly' | 'inviteOnly';
  maxAttendees?: number;
  isSoldOut?: boolean;
  _count?: {
    attendees: number;
  };
  pricingTiers?: Array<{
    id: string;
    name: string;
    description?: string;
    price: number;
    capacity?: number;
    startDate?: string;
    endDate?: string;
    isActive: boolean;
  }>;
  discountCodes?: Array<{
    id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    maxUses?: number;
    currentUses: number;
    startDate?: string;
    endDate?: string;
    isActive: boolean;
  }>;
  location?: {
    id: string;
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  group?: {
    id: string;
    name: string;
    isPrivate: boolean;
    memberCount?: number;
    members?: Array<GroupMember | GroupMemberLegacy>;
    _count?: {
      members: number;
    };
  };
  createdById?: string;
  createdBy?: {
    id: string;
    name: string;
    image?: string;
  };
  attendees?: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      image?: string;
    }
  }>;
  url?: string;
}

interface EventClientProps {
  event: EventType;
  isAttending: boolean;
  attendeeCount: number;
  onAttendanceToggle: () => Promise<void>;
  isLoading: boolean;
}

export default function EventDetailClient({ 
  event, 
  isAttending, 
  attendeeCount, 
  onAttendanceToggle, 
  isLoading 
}: EventClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  
  const handleShare = async () => {
    const shareData = {
      title: event.title,
      text: `Schau dir diese Veranstaltung an: ${event.title}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link kopiert!",
          description: "Der Link wurde in deine Zwischenablage kopiert.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const isEventOver = new Date(event.endTime || event.startTime) < new Date();
  const canEdit = session?.user?.id === event.createdById || 
                 (event.group && event.group.members?.some(
                   (member) => {
                     if ('userId' in member && 'role' in member) {
                       return member.userId === session?.user?.id && member.role === "ADMIN";
                     }
                     return false;
                   }
                 ));

  return (
    <div className="relative overflow-hidden pb-16">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50 to-transparent -z-10"></div>
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-100 rounded-full opacity-50 -z-10"></div>
      <div className="absolute top-96 -left-32 w-64 h-64 bg-indigo-100 rounded-full opacity-30 -z-10"></div>

      <div className="container mx-auto px-4">
        {/* Back navigation */}
        <div className="py-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Button>
        </div>

        {/* Event header section */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {event.sport && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                {event.sport}
              </Badge>
            )}
            {isEventOver ? (
              <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">
                Vergangen
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {formatDistanceToNow(new Date(event.startTime), { addSuffix: true, locale: de })}
              </Badge>
            )}
            {event.isRecurring && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                <RefreshCw className="h-3 w-3 mr-1" />
                Wiederkehrend
              </Badge>
            )}
            {event.isPaid && (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                <DollarSign className="h-3 w-3 mr-1" />
                {new Intl.NumberFormat('de-DE', {
                  style: 'currency',
                  currency: event.priceCurrency || 'EUR'
                }).format(event.price || 0)}
              </Badge>
            )}
            {event.joinRestriction === 'groupOnly' ? (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <Lock className="h-3 w-3 mr-1" />
                Nur Gruppe
              </Badge>
            ) : event.joinRestriction === 'inviteOnly' ? (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <Lock className="h-3 w-3 mr-1" />
                Nur mit Einladung
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <LockOpen className="h-3 w-3 mr-1" />
                Öffentlich
              </Badge>
            )}
            {event.group?.isPrivate && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <Users2 className="h-3 w-3 mr-1" />
                Private Gruppe
              </Badge>
            )}
            {event.isSoldOut && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                Ausverkauft
              </Badge>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{event.title}</h1>
          
          <div className="flex flex-wrap gap-6 mb-6 text-gray-500">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-500" />
              <span className="font-medium">
                {format(new Date(event.startTime), "EEEE, dd. MMMM yyyy", { locale: de })}
              </span>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-500" />
              <span>
                {format(new Date(event.startTime), "HH:mm", { locale: de })}
                {event.endTime && ` - ${format(new Date(event.endTime), "HH:mm", { locale: de })}`}
              </span>
            </div>
            {event.location && (
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-blue-500" />
                <span>{event.location.name}</span>
              </div>
            )}
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-500" />
              <span>{attendeeCount || 0} Teilnehmer</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            {!isEventOver && (
              <Button 
                className="gap-2"
                disabled={isLoading}
                variant={isAttending ? "outline" : "default"}
                onClick={onAttendanceToggle}
              >
                <Heart className={`h-4 w-4 ${isAttending ? "fill-red-500 text-red-500" : ""}`} />
                {isAttending ? "Teilnahme abmelden" : "Teilnehmen"}
              </Button>
            )}

            <Button variant="outline" className="gap-2" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              Teilen
            </Button>

            {event.group && (
              <Button variant="outline" className="gap-2" asChild>
                <Link href={`/groups/${event.group.id}`}>
                  <Users className="h-4 w-4" />
                  Gruppe ansehen
                </Link>
              </Button>
            )}

            {canEdit && (
              <>
                <Button variant="outline" className="gap-2" asChild>
                  <Link href={`/events/${event.id}/edit`}>
                    <Edit className="h-4 w-4" />
                    Bearbeiten
                  </Link>
                </Button>
                <Button variant="outline" className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-2" asChild>
                  <Link href={`/events/${event.id}/delete`}>
                    <Trash2 className="h-4 w-4" />
                    Löschen
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image */}
            {event.image && (
              <div className="rounded-xl overflow-hidden shadow-sm border border-gray-100 aspect-video relative">
                <img 
                  src={event.image} 
                  alt={event.title} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Tabs for different content sections */}
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="location">Ort</TabsTrigger>
                <TabsTrigger value="attendees">Teilnehmer</TabsTrigger>
              </TabsList>

              {/* Details tab */}
              <TabsContent value="details" className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold mb-4">Beschreibung</h2>
                {event.description ? (
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Keine Beschreibung vorhanden</p>
                )}

                {/* Pricing section */}
                {event.isPaid && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Preise & Tickets</h3>
                    
                    {/* Base price if no tiers */}
                    {(!event.pricingTiers || event.pricingTiers.length === 0) && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Standard Ticket</p>
                            {event.priceDescription && (
                              <p className="text-sm text-gray-600 mt-1">{event.priceDescription}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold">
                              {new Intl.NumberFormat('de-DE', {
                                style: 'currency',
                                currency: event.priceCurrency || 'EUR'
                              }).format(event.price || 0)}
                            </p>
                            {event.maxAttendees && (
                              <p className="text-sm text-gray-600">
                                {event._count?.attendees || 0} / {event.maxAttendees} verfügbar
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pricing tiers */}
                    {event.pricingTiers && event.pricingTiers.length > 0 && (
                      <div className="space-y-3">
                        {event.pricingTiers
                          .filter(tier => tier.isActive)
                          .map(tier => (
                          <div key={tier.id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{tier.name}</p>
                                {tier.description && (
                                  <p className="text-sm text-gray-600 mt-1">{tier.description}</p>
                                )}
                                {(tier.startDate || tier.endDate) && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {tier.startDate && `Ab ${format(new Date(tier.startDate), 'dd.MM.yyyy', { locale: de })}`}
                                    {tier.startDate && tier.endDate && ' - '}
                                    {tier.endDate && `Bis ${format(new Date(tier.endDate), 'dd.MM.yyyy', { locale: de })}`}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold">
                                  {new Intl.NumberFormat('de-DE', {
                                    style: 'currency',
                                    currency: event.priceCurrency || 'EUR'
                                  }).format(tier.price)}
                                </p>
                                {tier.capacity && (
                                  <p className="text-sm text-gray-600">
                                    {/* You might want to add a count of used capacity in your API */}
                                    {tier.capacity} Plätze verfügbar
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Discount codes section */}
                    {event.discountCodes && event.discountCodes.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-md font-semibold mb-3">Verfügbare Rabattcodes</h4>
                        <div className="space-y-2">
                          {event.discountCodes
                            .filter(code => code.isActive)
                            .map(code => (
                            <div key={code.id} className="bg-emerald-50 rounded-lg p-3">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-mono font-medium text-emerald-700">{code.code}</p>
                                  <p className="text-sm text-emerald-600">
                                    {code.discountType === 'percentage' 
                                      ? `${code.discountValue}% Rabatt`
                                      : `${new Intl.NumberFormat('de-DE', {
                                          style: 'currency',
                                          currency: event.priceCurrency || 'EUR'
                                        }).format(code.discountValue)} Rabatt`
                                    }
                                  </p>
                                </div>
                                {code.maxUses && (
                                  <p className="text-sm text-emerald-600">
                                    {code.maxUses - code.currentUses} verbleibend
                                  </p>
                                )}
                              </div>
                              {(code.startDate || code.endDate) && (
                                <p className="text-xs text-emerald-600 mt-1">
                                  {code.startDate && `Gültig ab ${format(new Date(code.startDate), 'dd.MM.yyyy', { locale: de })}`}
                                  {code.startDate && code.endDate && ' - '}
                                  {code.endDate && `bis ${format(new Date(code.endDate), 'dd.MM.yyyy', { locale: de })}`}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {event.url && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">Externe Links</h3>
                    <a 
                      href={event.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Website der Veranstaltung
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                )}
              </TabsContent>

              {/* Location tab */}
              <TabsContent value="location" className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {event.location && (
                  <Card className="mb-8 overflow-hidden border-gray-100">
                    <CardHeader className="bg-gray-50 py-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <CardTitle className="text-lg mb-1">{event.location.name}</CardTitle>
                          {event.location.address && (
                            <p className="text-gray-600 text-sm">{event.location.address}</p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <div className="h-[350px] relative">
                      {typeof window !== 'undefined' && event.location.latitude !== undefined && event.location.longitude !== undefined && (
                        <MapContainer
                          center={[event.location.latitude, event.location.longitude]}
                          zoom={14}
                          scrollWheelZoom={false}
                          style={{ height: '100%', width: '100%' }}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker position={[event.location.latitude, event.location.longitude]}>
                            <Popup>
                              <strong>{event.location.name}</strong>
                              <br />
                              {event.location.address}
                            </Popup>
                          </Marker>
                        </MapContainer>
                      )}
                      {(event.location.latitude === undefined || event.location.longitude === undefined) && (
                        <div className="flex items-center justify-center h-full bg-gray-50">
                          <div className="text-center p-6">
                            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-500">Keine Koordinaten für diesen Ort verfügbar</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <CardFooter className="py-3 border-t border-gray-100 bg-white">
                      {event.location.latitude !== undefined && event.location.longitude !== undefined ? (
                        <Button variant="link" className="text-green-600 p-0 h-auto" asChild>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${event.location.latitude},${event.location.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center"
                          >
                            In Google Maps öffnen
                            <ExternalLink className="h-3.5 w-3.5 ml-1" />
                          </a>
                        </Button>
                      ) : (
                        <p className="text-gray-500 text-sm">Kein Google Maps Link verfügbar</p>
                      )}
                    </CardFooter>
                  </Card>
                )}
              </TabsContent>

              {/* Attendees tab */}
              <TabsContent value="attendees" className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold mb-4">Teilnehmer</h2>
                
                {event.attendees && event.attendees.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {event.attendees.map((attendee) => (
                      <div 
                        key={attendee.id} 
                        className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Avatar className="h-16 w-16 mb-2">
                          <AvatarImage src={attendee.user?.image || undefined} alt={attendee.user?.name || 'User'} />
                          <AvatarFallback>
                            {attendee.user?.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <p className="font-medium text-sm text-center line-clamp-1">{attendee.user?.name || 'Unbekannt'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium">Keine Teilnehmer</h3>
                    <p className="text-gray-500 max-w-md mx-auto mt-2">
                      Diese Veranstaltung hat noch keine Teilnehmer.
                    </p>
                    {!isEventOver && (
                      <Button 
                        className="mt-6"
                        disabled={isLoading}
                        variant={isAttending ? "outline" : "default"}
                        onClick={onAttendanceToggle}
                      >
                        <Heart className={`h-4 w-4 mr-2 ${isAttending ? "fill-red-500 text-red-500" : ""}`} />
                        {isAttending ? "Teilnahme abmelden" : "Sei der erste Teilnehmer"}
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Organizer info */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-bold mb-4">Organisiert von</h2>
                
                {event.group ? (
                  <div className="flex items-center p-3 rounded-lg bg-gray-50">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{event.group.name}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {event.group.members?.length || event.group._count?.members || event.group.memberCount || 0} Mitglieder
                      </p>
                    </div>
                    <Link 
                      href={`/groups/${event.group.id}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline text-sm ml-2"
                    >
                      Ansehen
                    </Link>
                  </div>
                ) : event.createdBy ? (
                  <div className="flex items-center p-3 rounded-lg bg-gray-50">
                    <Avatar className="mr-3">
                      <AvatarImage src={event.createdBy.image} alt={event.createdBy.name} />
                      <AvatarFallback>
                        {event.createdBy.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{event.createdBy.name}</p>
                      <p className="text-sm text-gray-500">Veranstalter</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Keine Informationen zum Veranstalter</p>
                )}
              </CardContent>
            </Card>

            {/* Date & Time Card */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-bold mb-4">Datum & Uhrzeit</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 mr-3 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium">
                        {format(new Date(event.startTime), "EEEE, dd. MMMM yyyy", { locale: de })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(event.startTime), { addSuffix: true, locale: de })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 mr-3 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium">
                        {format(new Date(event.startTime), "HH:mm", { locale: de })} Uhr
                        {event.endTime && ` - ${format(new Date(event.endTime), "HH:mm", { locale: de })} Uhr`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {event.endTime ? (
                          `Dauer: ${Math.floor(differenceInMinutes(new Date(event.endTime), new Date(event.startTime)) / 60)} Stunden ${differenceInMinutes(new Date(event.endTime), new Date(event.startTime)) % 60} Minuten`
                        ) : (
                          "Keine Endzeit angegeben"
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {event.isRecurring && (
                    <div className="flex items-start">
                      <RefreshCw className="h-5 w-5 mr-3 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Wiederholung</p>
                        <p className="text-sm text-gray-500">
                          {event.recurringPattern === 'weekly' ? 'Wöchentlich' : 
                           event.recurringPattern === 'monthly' ? 'Monatlich' : 
                           event.recurringPattern === 'daily' ? 'Täglich' : 
                           'Wiederkehrend'}
                          {event.recurringDays && event.recurringDays.length > 0 && (
                            ` an ${event.recurringDays.map(day => 
                              ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][day]
                            ).join(', ')}`
                          )}
                          {event.recurringEndDate && (
                            ` bis ${format(new Date(event.recurringEndDate), 'dd.MM.yyyy', { locale: de })}`
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {!isEventOver && (
                  <Button className="w-full mt-4" variant="outline">
                    Zum Kalender hinzufügen
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Related events */}
            {event.group && (
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-xl font-bold mb-4">Mehr von dieser Gruppe</h2>
                  
                  <div className="text-center py-4">
                    <p className="text-gray-500">
                      Schau dir weitere Veranstaltungen dieser Gruppe an.
                    </p>
                    <Button variant="outline" className="mt-4 w-full" asChild>
                      <Link href={`/groups/${event.group.id}`}>
                        Zur Gruppenübersicht
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 