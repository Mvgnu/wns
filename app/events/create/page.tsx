import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSafeServerSession } from '@/lib/sessionHelper';
import EventForm from '@/components/events/EventForm';
import { Suspense } from 'react';

export default async function CreateEventPage() {
  // Use safe session helper to handle JWT errors gracefully
  const session = await getSafeServerSession();
  
  // If user is not authenticated, redirect to sign in
  if (!session?.user) {
    // Add returnUrl to redirect back after authentication
    redirect('/auth/signin?returnUrl=/events/create');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Event</h1>
      <Suspense fallback={<div className="flex justify-center py-8">Loading...</div>}>
        <EventForm />
      </Suspense>
    </div>
  );
} 