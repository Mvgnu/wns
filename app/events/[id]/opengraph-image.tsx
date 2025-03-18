import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';

export const runtime = 'edge';
export const alt = 'Event Details';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: { id: string } }) {
  // Fetch event data
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      organizer: {
        select: {
          name: true,
        },
      },
      group: {
        select: {
          name: true,
          sport: true,
        },
      },
      location: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!event) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: 'white',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
          }}
        >
          <div style={{ fontSize: 48, fontWeight: 'bold', marginBottom: 16 }}>
            Event not found
          </div>
        </div>
      ),
      { ...size }
    );
  }

  // Format the date
  const formattedDate = new Date(event.startTime).toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: 'linear-gradient(to right, #3b82f6, #4f46e5)',
          color: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
        }}
      >
        <div style={{ fontSize: 48, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
          {event.title}
        </div>
        
        <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.9 }}>
          {formattedDate}
        </div>
        
        {event.group && (
          <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.8 }}>
            {event.group.name} • {event.group.sport}
          </div>
        )}
        
        {event.location && (
          <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.8 }}>
            @ {event.location.name}
          </div>
        )}
        
        <div style={{ fontSize: 20, marginTop: 32, opacity: 0.7 }}>
          WNS Community Event
        </div>
      </div>
    ),
    { ...size }
  );
} 