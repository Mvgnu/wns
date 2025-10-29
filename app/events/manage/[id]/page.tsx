'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Check, Clock, Loader2, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface EventSummary {
  confirmedCount: number;
  waitlistCount: number;
  capacity: number | null;
  isFull: boolean;
}

interface RsvpEntry {
  id: string;
  eventId: string;
  user: { id: string; name: string | null; image: string | null };
  status: 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED' | 'CHECKED_IN' | 'NO_SHOW';
  waitlistedAt?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  checkedInAt?: string;
}

interface FeedbackEntry {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null };
}

interface EventResponse {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  image: string | null;
  organizer: { id: string; name: string | null; image: string | null };
  group?: { id: string; name: string; slug?: string | null } | null;
  attendanceSummary?: EventSummary;
}

interface RsvpDashboardResponse {
  rsvps: RsvpEntry[];
  summary: EventSummary;
  feedback: FeedbackEntry[];
  meta: { totalRsvps: number; totalFeedback: number; averageRating: number | null };
}

type RsvpAction = 'confirm' | 'waitlist' | 'cancel' | 'check-in' | 'no-show' | 'sweep-waitlist';

const STATUS_CONFIG: Record<RsvpEntry['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }>
  = {
    CONFIRMED: { label: 'Bestätigt', variant: 'default' },
    WAITLISTED: { label: 'Warteliste', variant: 'secondary' },
    CANCELLED: { label: 'Abgesagt', variant: 'outline' },
    CHECKED_IN: { label: 'Eingecheckt', variant: 'default' },
    NO_SHOW: { label: 'Nicht erschienen', variant: 'destructive' },
  };

export default function ManageEventPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const eventId = params?.id as string | undefined;

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [rsvpData, setRsvpData] = useState<RsvpDashboardResponse | null>(null);
  const [feedbackDialog, setFeedbackDialog] = useState<{ open: boolean; user?: RsvpEntry['user'] }>({ open: false });
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState('');

  useEffect(() => {
    if (!eventId) return;

    async function loadData() {
      try {
        setLoading(true);
        const [eventRes, dashboardRes] = await Promise.all([
          fetch(`/api/events/${eventId}`),
          fetch(`/api/events/${eventId}/rsvp`),
        ]);

        if (eventRes.status === 401 || eventRes.status === 403) {
          router.push(`/auth/signin?callbackUrl=/events/manage/${eventId}`);
          return;
        }

        if (!eventRes.ok) {
          throw new Error('Veranstaltung konnte nicht geladen werden');
        }

        if (dashboardRes.status === 401) {
          router.push(`/auth/signin?callbackUrl=/events/manage/${eventId}`);
          return;
        }

        if (dashboardRes.status === 403) {
          throw new Error('Nur Organisatoren können diese Seite sehen');
        }

        if (!dashboardRes.ok) {
          throw new Error('RSVP-Daten konnten nicht geladen werden');
        }

        const eventData: EventResponse = await eventRes.json();
        const dashboardData: RsvpDashboardResponse = await dashboardRes.json();

        setEvent(eventData);
        setRsvpData(dashboardData);
      } catch (error) {
        console.error(error);
        toast({
          title: 'Fehler',
          description: error instanceof Error ? error.message : 'Daten konnten nicht geladen werden',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [eventId, router, toast]);

  const summary = rsvpData?.summary;

  const capacityLabel = useMemo(() => {
    if (!summary) return '—';
    if (summary.capacity === null) {
      return `${summary.confirmedCount} Teilnehmer`;
    }
    return `${summary.confirmedCount}/${summary.capacity} Teilnehmer`;
  }, [summary]);

  const handleRsvpAction = async (action: RsvpAction, targetUserId?: string) => {
    if (!eventId) return;
    try {
      setActionLoading(`${action}-${targetUserId ?? 'all'}`);
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, targetUserId }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || 'Aktion fehlgeschlagen');
      }

      const payload = await response.json();
      setRsvpData({
        rsvps: payload.rsvps,
        summary: payload.summary,
        feedback: payload.feedback,
        meta: payload.meta ?? rsvpData?.meta ?? { totalFeedback: 0, totalRsvps: 0, averageRating: null },
      });

      toast({
        title: 'Aktualisiert',
        description: 'Der Teilnahmestatus wurde aktualisiert.',
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Aktion fehlgeschlagen',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!eventId || !feedbackDialog.user) return;
    try {
      setActionLoading(`feedback-${feedbackDialog.user.id}`);
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'feedback',
          targetUserId: feedbackDialog.user.id,
          rating: feedbackRating,
          comment: feedbackComment,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Feedback konnte nicht gespeichert werden');
      }

      const payload = await response.json();
      setRsvpData({
        rsvps: payload.rsvps,
        summary: payload.summary,
        feedback: payload.feedback,
        meta: payload.meta ?? rsvpData?.meta ?? { totalFeedback: 0, totalRsvps: 0, averageRating: null },
      });
      toast({ title: 'Feedback gespeichert' });
      setFeedbackDialog({ open: false });
      setFeedbackComment('');
      setFeedbackRating(5);
    } catch (error) {
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Feedback konnte nicht gespeichert werden',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Event-Daten werden geladen…</span>
        </div>
      </div>
    );
  }

  if (!event || !rsvpData) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-xl mx-auto text-center">
          <CardHeader>
            <CardTitle>Event nicht gefunden</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Wir konnten diese Veranstaltung nicht laden oder Sie besitzen keine Berechtigung.
            </p>
            <Button asChild>
              <Link href="/events">Zurück zur Eventübersicht</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderRsvpActions = (entry: RsvpEntry) => {
    const buttons: Array<{ key: string; label: string; action: RsvpAction; variant?: 'default' | 'outline' | 'destructive' }>
      = [];

    switch (entry.status) {
      case 'WAITLISTED':
        buttons.push({ key: 'confirm', label: 'Bestätigen', action: 'confirm' });
        buttons.push({ key: 'cancel', label: 'Entfernen', action: 'cancel', variant: 'outline' });
        break;
      case 'CONFIRMED':
        buttons.push({ key: 'check-in', label: 'Check-in', action: 'check-in' });
        buttons.push({ key: 'waitlist', label: 'Auf Warteliste', action: 'waitlist', variant: 'outline' });
        buttons.push({ key: 'cancel', label: 'Stornieren', action: 'cancel', variant: 'outline' });
        break;
      case 'CHECKED_IN':
        buttons.push({ key: 'no-show', label: 'Als No-Show markieren', action: 'no-show', variant: 'outline' });
        buttons.push({ key: 'waitlist', label: 'Auf Warteliste', action: 'waitlist', variant: 'outline' });
        break;
      case 'NO_SHOW':
        buttons.push({ key: 'check-in', label: 'Check-in zurücknehmen', action: 'check-in' });
        buttons.push({ key: 'waitlist', label: 'Auf Warteliste', action: 'waitlist', variant: 'outline' });
        break;
      case 'CANCELLED':
        buttons.push({ key: 'confirm', label: 'Reaktivieren', action: 'confirm' });
        break;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {buttons.map((btn) => (
          <Button
            key={btn.key}
            size="sm"
            variant={btn.variant ?? 'default'}
            disabled={actionLoading === `${btn.action}-${entry.user.id}`}
            onClick={() => handleRsvpAction(btn.action, entry.user.id)}
          >
            {actionLoading === `${btn.action}-${entry.user.id}` ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : null}
            {btn.label}
          </Button>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {event.image ? (
            <Image
              src={event.image}
              alt={event.title}
              width={80}
              height={80}
              className="h-20 w-20 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-muted text-3xl font-semibold">
              {event.title.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{event.title}</h1>
            <p className="text-muted-foreground">
              {format(new Date(event.startTime), "PPPp", { locale: de })}
            </p>
            {event.group ? (
              <Link href={`/groups/${event.group.slug ?? event.group.id}`} className="text-sm text-primary underline">
                Gruppe ansehen
              </Link>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {capacityLabel}
          </Badge>
          <Badge variant={summary?.waitlistCount ? 'secondary' : 'outline'} className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {summary?.waitlistCount ?? 0} auf Warteliste
          </Badge>
          <Button
            variant="outline"
            disabled={actionLoading === 'sweep-waitlist-all'}
            onClick={() => handleRsvpAction('sweep-waitlist')}
          >
            {actionLoading === 'sweep-waitlist-all' ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="mr-2 h-3.5 w-3.5" />
            )}
            Warteliste prüfen
          </Button>
        </div>
      </div>

      <Tabs defaultValue="attendance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="attendance">Teilnehmende</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Teilnehmerverwaltung</CardTitle>
              <span className="text-sm text-muted-foreground">
                {summary?.confirmedCount ?? 0} bestätigt · {summary?.waitlistCount ?? 0} Warteliste
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              {rsvpData.rsvps.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground">Noch keine RSVPs vorhanden.</div>
              ) : (
                <div className="space-y-4">
                  {rsvpData.rsvps.map((entry) => (
                    <div key={entry.id} className="flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          {entry.user.image ? (
                            <AvatarImage src={entry.user.image} alt={entry.user.name ?? 'Teilnehmer'} />
                          ) : (
                            <AvatarFallback>{entry.user.name?.slice(0, 2).toUpperCase() ?? 'TN'}</AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="font-medium">{entry.user.name ?? 'Unbekannter Teilnehmer'}</div>
                          <div className="text-xs text-muted-foreground">
                            {entry.confirmedAt ? `Bestätigt am ${format(new Date(entry.confirmedAt), 'P', { locale: de })}` : 'Noch nicht bestätigt'}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
                        <Badge variant={STATUS_CONFIG[entry.status].variant}>{STATUS_CONFIG[entry.status].label}</Badge>
                        <div className="text-xs text-muted-foreground">
                          {entry.checkedInAt
                            ? `Check-in ${format(new Date(entry.checkedInAt), 'Pp', { locale: de })}`
                            : entry.waitlistedAt
                            ? `Warteliste seit ${format(new Date(entry.waitlistedAt), 'Pp', { locale: de })}`
                            : null}
                        </div>
                        {renderRsvpActions(entry)}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setFeedbackDialog({ open: true, user: entry.user })}
                        >
                          Feedback erfassen
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Feedbackübersicht</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4" />
                {rsvpData.meta.averageRating ? `${rsvpData.meta.averageRating.toFixed(1)} / 5` : 'Noch kein Feedback'}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {rsvpData.feedback.length === 0 ? (
                <div className="text-sm text-muted-foreground">Noch kein Feedback vorhanden.</div>
              ) : (
                <div className="space-y-3">
                  {rsvpData.feedback.map((item) => (
                    <div key={item.id} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            {item.user.image ? (
                              <AvatarImage src={item.user.image} alt={item.user.name ?? 'Teilnehmer'} />
                            ) : (
                              <AvatarFallback>{item.user.name?.slice(0, 2).toUpperCase() ?? 'TN'}</AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium">{item.user.name ?? 'Teilnehmer'}</div>
                            <div className="text-xs text-muted-foreground">{format(new Date(item.createdAt), 'Pp', { locale: de })}</div>
                          </div>
                        </div>
                        <Badge variant="outline">{item.rating} / 5</Badge>
                      </div>
                      {item.comment ? (
                        <p className="mt-3 text-sm text-muted-foreground">{item.comment}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={feedbackDialog.open} onOpenChange={(open) => setFeedbackDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feedback erfassen</DialogTitle>
            <DialogDescription>
              Hinterlassen Sie eine Bewertung für {feedbackDialog.user?.name ?? 'diesen Teilnehmer'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Bewertung (1-5)</label>
              <select
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={feedbackRating}
                onChange={(event) => setFeedbackRating(Number(event.target.value))}
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Kommentar</label>
              <Textarea
                value={feedbackComment}
                onChange={(event) => setFeedbackComment(event.target.value)}
                placeholder="Was lief gut? Was können wir verbessern?"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setFeedbackDialog({ open: false })}>
              Abbrechen
            </Button>
            <Button onClick={handleFeedbackSubmit} disabled={actionLoading?.startsWith('feedback-')}>
              {actionLoading?.startsWith('feedback-') ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
