'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { StarIcon } from 'lucide-react';
import LocationMap from '@/components/locations/LocationMap';
import LocationReviews from '@/components/locations/LocationReviews';
import { formatDate } from '@/lib/utils';

// Define props type
type LocationPageClientProps = {
  location: any; // Replace with a specific type if possible
  averageRating: number;
};

export default function LocationPageClient({
  location,
  averageRating,
}: LocationPageClientProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const handleShareClick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: location.name,
          text: `Schau dir diesen Ort an: ${location.name}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Fehler beim Teilen:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Link kopiert!',
          description: 'Orts-Link in die Zwischenablage kopiert',
          variant: 'default',
        });
      } catch (error) {
        console.error('Fehler beim Kopieren in die Zwischenablage:', error);
        toast({
          title: 'Fehler',
          description: 'Link konnte nicht in die Zwischenablage kopiert werden',
          variant: 'destructive',
        });
      }
    }
  };

  const handleReviewSubmit = async () => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/locations/${location.id}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/locations/${location.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Bewertung konnte nicht übermittelt werden');
      }

      toast({
        title: 'Bewertung übermittelt!',
        description: 'Vielen Dank für dein Feedback',
        variant: 'default',
      });
      setIsReviewDialogOpen(false);
      setReviewRating(5);
      setReviewComment('');
      router.refresh();
    } catch (error) {
      console.error('Fehler beim Übermitteln der Bewertung:', error);
      toast({
        title: 'Fehler',
        description:
          error instanceof Error ? error.message : 'Bewertung konnte nicht übermittelt werden',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const mapContainerStyles = {
    zIndex: 0,
  };

  const starStyles = (index: number, rating: number, hoverRating: number | null) => {
    const isFilled = 
      (index <= (hoverRating !== null ? hoverRating : rating - 1));
    
    return {
      cursor: 'pointer',
      color: isFilled ? '#FFD700' : '#D1D5DB',
      fill: isFilled ? '#FFD700' : 'none',
      transform: isFilled ? 'scale(1.2)' : 'scale(1)',
      transition: 'all 0.2s ease',
    };
  };

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="relative h-64 w-full">
              {location.images.length > 0 ? (
                <Image
                  src={location.images[0]}
                  alt={location.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-400 dark:text-gray-500 text-lg">
                    Kein Bild verfügbar
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="flex items-center">
                  <h1 className="text-3xl font-bold mr-2">{location.name}</h1>
                  {averageRating > 0 && (
                    <div className="bg-yellow-400 text-gray-900 px-2 py-1 rounded-md text-sm font-medium flex items-center">
                      {averageRating.toFixed(1)}
                      <StarIcon className="w-4 h-4 ml-1" />
                    </div>
                  )}
                </div>
                <p className="text-sm opacity-90 mt-1">
                  {location.type} · {location.sport} · Hinzugefügt am{' '}
                  {formatDate(location.createdAt)}
                </p>
              </div>
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="relative h-10 w-10 rounded-full overflow-hidden mr-3">
                    <Image
                      src={location.addedBy.image || '/images/default-avatar.png'}
                      alt={location.addedBy.name || 'Anonym'}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Hinzugefügt von
                    </span>
                    <Link
                      href={`/profile/${location.addedBy.id}`}
                      className="block font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {location.addedBy.name || 'Anonym'}
                    </Link>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={handleShareClick}>
                    Teilen
                  </Button>
                  <Button onClick={() => setIsReviewDialogOpen(true)}>
                    Bewertung hinzufügen
                  </Button>
                </div>
              </div>

              {location.description && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-2">Beschreibung</h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    {location.description}
                  </p>
                </div>
              )}

              {location.address && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  <h2 className="text-lg font-semibold mb-2">Adresse</h2>
                  <p>{location.address}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold">Karte</h2>
            </div>
            <div className="h-96 w-full" style={{ zIndex: 0, position: 'relative' }}>
              <LocationMap
                latitude={location.latitude}
                longitude={location.longitude}
                name={location.name}
                isLineBased={location.isLineBased}
                coordinates={location.coordinates}
                initialZoom={14}
                className="h-80 rounded-md overflow-hidden border mt-4"
              />
            </div>
          </div>

          {location.images.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b dark:border-gray-700">
                <h2 className="text-lg font-semibold">Galerie</h2>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {location.images.map((image: string, index: number) => (
                  <div
                    key={index}
                    className="relative h-40 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700"
                  >
                    <Image
                      src={image}
                      alt={`Bild ${index + 1} von ${location.name}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {location.events.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Kommende Veranstaltungen</h2>
                <Link
                  href={`/events/create?locationId=${location.id}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                >
                  + Veranstaltung erstellen
                </Link>
              </div>
              <div className="p-4">
                {location.events.map((event: any) => (
                  <Link href={`/events/${event.id}`} key={event.id}>
                    <div className="border dark:border-gray-700 rounded-lg p-4 mb-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition">
                      <h3 className="font-medium">{event.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {formatDate(event.startTime)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                Bewertungen ({location.reviews.length})
              </h2>
              <Button
                variant="ghost"
                onClick={() => setIsReviewDialogOpen(true)}
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                + Bewertung hinzufügen
              </Button>
            </div>
            <div className="p-4">
              <LocationReviews reviews={location.reviews} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold">Details</h2>
            </div>
            <div className="p-4">
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Typ
                  </dt>
                  <dd className="mt-1 text-gray-900 dark:text-gray-100">
                    {location.type}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Sportart
                  </dt>
                  <dd className="mt-1 text-gray-900 dark:text-gray-100">
                    {location.sport}
                  </dd>
                </div>
                {location.address && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Adresse
                    </dt>
                    <dd className="mt-1 text-gray-900 dark:text-gray-100">
                      {location.address}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Hinzugefügt am
                  </dt>
                  <dd className="mt-1 text-gray-900 dark:text-gray-100">
                    {formatDate(location.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Bewertung
                  </dt>
                  <dd className="mt-1 flex items-center">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          className={`h-5 w-5 ${
                            star <= Math.round(averageRating)
                              ? 'text-yellow-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-gray-900 dark:text-gray-100">
                        {averageRating.toFixed(1)} ({location.reviews.length} Bewertungen)
                      </span>
                    </div>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold">Aktionen</h2>
            </div>
            <div className="p-4 space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsReviewDialogOpen(true)}
              >
                Bewertung hinzufügen
              </Button>
              <Link
                href={`/events/create?locationId=${location.id}`}
                className="block w-full"
              >
                <Button variant="outline" className="w-full">
                  Veranstaltung hier erstellen
                </Button>
              </Link>
              <Button variant="outline" onClick={handleShareClick} className="w-full">
                Teilen
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="z-50">
          <DialogHeader>
            <DialogTitle>Bewertung hinzufügen</DialogTitle>
            <DialogDescription>
              Teile deine Erfahrungen mit {location.name}. Deine Bewertung hilft anderen Nutzern, diesen Ort besser zu verstehen.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-6">
              <p className="text-sm font-medium mb-2">Deine Bewertung</p>
              <div className="flex items-center mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isSelected = star <= reviewRating;
                    return (
                      <span
                        key={star}
                        className="cursor-pointer px-1 relative"
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                      >
                        <StarIcon
                          className={`h-8 w-8 transition-all duration-200 ${
                            isSelected
                              ? 'text-yellow-400 fill-yellow-400 scale-110'
                              : 'text-gray-300 hover:text-yellow-200'
                          }`}
                        />
                      </span>
                    );
                  })}
                </div>
                <span className="ml-2 font-medium">{reviewRating} von 5</span>
              </div>
            </div>
            <div>
              <label
                htmlFor="comment"
                className="block text-sm font-medium mb-2"
              >
                Kommentar (optional)
              </label>
              <Textarea
                id="comment"
                placeholder="Teile deine Erfahrungen mit diesem Ort..."
                rows={5}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReviewDialogOpen(false)}
            >
              Abbrechen
            </Button>
            <Button onClick={handleReviewSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Wird übermittelt...' : 'Bewertung abschicken'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 