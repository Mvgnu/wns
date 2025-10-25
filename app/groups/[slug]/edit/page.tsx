'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import GroupForm from '@/components/groups/GroupForm';
import { toast } from '@/components/ui/use-toast';

type Group = {
  id: string;
  name: string;
  description?: string;
  sport: string;
  sports?: string[];
  location?: string;
  image?: string;
  ownerId: string;
  isPrivate?: boolean;
};

export default function EditGroupPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { data: session, status } = useSession();
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch group data
  useEffect(() => {
    const fetchGroup = async () => {
      if (!slug) return;

      try {
        // Try by slug first, then by ID for backward compatibility
        const response = await fetch(`/api/groups/${slug}`);
        if (response.status === 404) {
          setError('Group not found');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch group');
        }

        const data = await response.json();
        setGroup(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (status !== 'loading') {
      fetchGroup();
    }
  }, [slug, status]);

  // Check if user is authorized to edit
  useEffect(() => {
    if (!isLoading && group && session?.user) {
      // Only the owner can edit the group
      if (group.ownerId !== session.user.id) {
        toast({
          title: "Nicht autorisiert",
          description: "Du bist nicht berechtigt, diese Gruppe zu bearbeiten",
          variant: "destructive"
        });
        router.push(`/groups/${group.slug || group.id}`);
      }
    }
  }, [group, session, router, isLoading]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=/groups/${slug}/edit`);
    }
  }, [status, router, slug]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we fetch the group data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Error</h1>
              <p className="text-gray-600 dark:text-gray-300">{error}</p>
              <button 
                onClick={() => router.back()} 
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Edit Group: {group.name}</h1>
            <GroupForm initialData={group} isEditing={true} />
          </div>
        </div>
      </div>
    </div>
  );
} 