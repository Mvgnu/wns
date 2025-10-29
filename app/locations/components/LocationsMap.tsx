'use client';

// component: locations-map-hotspots

import { Fragment, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import type { PointExpression } from 'leaflet';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Radar } from 'lucide-react';
import Link from 'next/link';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon.src,
  shadowUrl: iconShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationSummary {
  id: string;
  name: string;
  slug?: string | null;
  latitude: number;
  longitude: number;
  sport: string | null;
  sports: string[];
  city: string | null;
  state: string | null;
  country: string | null;
  image: string | null;
  eventCount: number;
}

interface HotspotEvent {
  id: string;
  title: string;
  slug: string | null;
  startTime: string;
  distanceMeters: number;
  locationName: string | null;
  group: {
    id: string;
    name: string;
    slug: string | null;
  } | null;
}

interface HotspotPayload {
  id: string;
  center: { latitude: number; longitude: number };
  radiusMeters: number;
  total: number;
  dominantSport: string;
  venues: LocationSummary[];
  nearbyEvents: HotspotEvent[];
}

interface LocationsMapProps {
  locations: LocationSummary[];
  center: [number, number];
  zoom?: number;
}

const DATE_FORMATTER = new Intl.DateTimeFormat('de-DE', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function formatDistance(distanceMeters: number) {
  if (distanceMeters < 1_000) {
    return `${Math.round(distanceMeters)} m`;
  }
  return `${(distanceMeters / 1_000).toFixed(1)} km`;
}

export default function LocationsMap({ locations, center, zoom = 6 }: LocationsMapProps) {
  const [hotspots, setHotspots] = useState<HotspotPayload[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadHotspots() {
      try {
        const response = await fetch('/api/locations/hotspots?limit=24', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Hotspot feed unavailable');
        }
        const data = (await response.json()) as { hotspots: HotspotPayload[] };
        if (isMounted) {
          setHotspots(data.hotspots);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
        }
      }
    }

    loadHotspots();
    return () => {
      isMounted = false;
    };
  }, []);

  const dataset = useMemo(() => {
    if (hotspots.length > 0) {
      return hotspots;
    }

    return locations.map(location => ({
      id: location.id,
      center: { latitude: location.latitude, longitude: location.longitude },
      radiusMeters: 750,
      total: location.eventCount || 1,
      dominantSport: location.sport || location.sports[0] || 'mixed',
      venues: [location],
      nearbyEvents: [],
    }));
  }, [hotspots, locations]);

  const bounds = useMemo(() => {
    if (dataset.length === 0) {
      return null;
    }

    const latLngs = dataset.map(point => L.latLng(point.center.latitude, point.center.longitude));
    return L.latLngBounds(latLngs);
  }, [dataset]);

  const mapProps = bounds
    ? { bounds, boundsOptions: { padding: [48, 48] as PointExpression } }
    : { center, zoom };

  return (
    <div className="relative">
      {error && (
        <div className="absolute z-[1000] top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white text-sm px-4 py-2 rounded-full shadow-lg">
          {error}
        </div>
      )}
      <MapContainer
        {...mapProps}
        style={{ height: '600px', width: '100%' }}
        scrollWheelZoom={true}
      >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {dataset.map(hotspot => (
        <Fragment key={hotspot.id}>
          <Circle
            center={[hotspot.center.latitude, hotspot.center.longitude]}
            radius={hotspot.radiusMeters}
            pathOptions={{ color: '#22c55e', fillOpacity: 0.1 }}
          />
          <Marker
            position={[hotspot.center.latitude, hotspot.center.longitude]}
          >
            <Popup minWidth={320}>
              <Card className="border-0 shadow-none">
                <CardHeader className="p-0 pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Radar className="h-4 w-4 text-emerald-500" />
                    Hotspot · {hotspot.dominantSport}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {hotspot.total} Orte im Radius von {formatDistance(hotspot.radiusMeters)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 pb-3 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Beliebte Locations</p>
                    <div className="space-y-2">
                      {hotspot.venues.map(venue => (
                        <div key={venue.id} className="flex items-start justify-between gap-3">
                          <div>
                            <Link href={`/locations/${venue.slug ?? venue.id}`} className="font-medium hover:text-emerald-600">
                              {venue.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {[venue.city, venue.state, venue.country].filter(Boolean).join(', ')}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {venue.sports.slice(0, 3).map(sport => (
                                <Badge key={sport} variant="secondary" className="text-[10px]">
                                  {sport}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="text-right text-xs text-muted-foreground flex flex-col items-end gap-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {venue.eventCount} Events
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {hotspot.nearbyEvents.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Nächste Events</p>
                      <div className="space-y-2">
                        {hotspot.nearbyEvents.map(event => (
                          <div key={event.id} className="text-sm space-y-1 border-l-2 border-emerald-200 pl-3">
                            <Link
                              href={`/events/${event.slug ?? event.id}`}
                              className="font-medium hover:text-emerald-600"
                            >
                              {event.title}
                            </Link>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span>{DATE_FORMATTER.format(new Date(event.startTime))}</span>
                              <span>· {formatDistance(event.distanceMeters)}</span>
                              {event.group && (
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  <Link
                                    href={`/groups/${event.group.slug ?? event.group.id}`}
                                    className="hover:text-emerald-600"
                                  >
                                    {event.group.name}
                                  </Link>
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-0">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link
                      href={`/locations?search=${encodeURIComponent(hotspot.dominantSport)}`}
                    >
                      Mehr {hotspot.dominantSport} Orte entdecken
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </Popup>
          </Marker>
        </Fragment>
      ))}

      </MapContainer>
    </div>
  );
}
