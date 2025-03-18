'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';

type Member = {
  id: string;
  name: string | null;
  image: string | null;
  isOwner?: boolean;
};

type GroupData = {
  id: string;
  name: string;
  ownerId: string;
  members: Member[];
};

export default function GroupMembersPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const groupId = params?.id as string;

  const [group, setGroup] = useState<GroupData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOwner, setIsOwner] = useState(false);

  // Fetch group data
  useEffect(() => {
    async function fetchGroup() {
      if (!groupId) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/groups/${groupId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch group');
        }
        
        const data = await response.json();
        setGroup(data);
        
        // Check if current user is the owner
        if (session?.user?.id === data.ownerId) {
          setIsOwner(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    if (status !== 'loading') {
      fetchGroup();
    }
  }, [groupId, session, status]);

  const handleRemoveMember = async (memberId: string) => {
    if (!isOwner || !groupId) return;
    
    try {
      const response = await fetch(`/api/groups/${groupId}/members`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'remove',
          userId: memberId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove member');
      }
      
      // Update the UI
      setGroup(prev => {
        if (!prev) return null;
        return {
          ...prev,
          members: prev.members.filter(member => member.id !== memberId),
        };
      });
      
      toast.success('Member removed successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  // Filter members based on search term
  const filteredMembers = group?.members.filter(member => 
    member.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center">
                    <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-12 w-12"></div>
                    <div className="ml-4 flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Error</h1>
              <p className="text-gray-600 dark:text-gray-300">{error || 'Group not found'}</p>
              <Button 
                onClick={() => router.back()} 
                className="mt-4"
              >
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b dark:border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold">Members of {group.name}</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                </p>
              </div>
              
              <div className="mt-4 md:mt-0">
                <Link href={`/groups/${groupId}`}>
                  <Button variant="outline">
                    Back to Group
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <Input
                type="search"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
            
            <div className="space-y-4">
              {filteredMembers.length > 0 ? (
                filteredMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750">
                    <div className="flex items-center">
                      <div className="relative h-12 w-12 rounded-full overflow-hidden">
                        <Image
                          src={member.image || '/images/default-avatar.png'}
                          alt={member.name || 'Anonymous'}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="ml-4">
                        <Link href={`/profile/${member.id}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                          {member.name || 'Anonymous'}
                        </Link>
                        {member.id === group.ownerId && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                            Owner
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {isOwner && member.id !== session?.user?.id && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No members found matching your search.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 