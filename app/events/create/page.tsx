import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import CreateEventForm from './components/CreateEventForm';

// Server component that fetches data and passes it to the client component
export default async function CreateEventPage({
  searchParams,
}: {
  searchParams: { groupId?: string; locationId?: string };
}) {
  const session = await getServerSession(authOptions);
  
  // Redirect if not authenticated
  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/events/create');
  }

  // Parse the query parameters
  const groupId = searchParams.groupId;
  const locationId = searchParams.locationId;
  
  // Fetch available groups the user is a member of
  const userGroups = await prisma.group.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        { members: { some: { id: session.user.id } } },
      ],
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
  
  // Add isPrivate property by fetching it separately
  const userGroupsWithIsPrivate = await Promise.all(
    userGroups.map(async (group) => {
      const fullGroup = await prisma.group.findUnique({
        where: { id: group.id },
        select: { isPrivate: true }
      });
      return {
        ...group,
        isPrivate: fullGroup?.isPrivate || false
      };
    })
  );
  
  // Fetch available locations
  const locations = await prisma.location.findMany({
    select: {
      id: true,
      name: true,
      address: true,
      sport: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
  
  // Check if the user has access to the specified group
  let hasGroupAccess = true;
  let preSelectedGroup = null;
  
  if (groupId) {
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { id: session.user.id } } },
        ],
      },
      select: {
        id: true,
        name: true,
      },
    });
    
    if (group) {
      const fullGroup = await prisma.group.findUnique({
        where: { id: group.id },
        select: { isPrivate: true }
      });
      
      preSelectedGroup = {
        ...group,
        isPrivate: fullGroup?.isPrivate || false
      };
    } else {
      hasGroupAccess = false;
    }
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Neue Veranstaltung erstellen</h1>
            
            {!hasGroupAccess && groupId && (
              <div className="mb-6 p-4 border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 rounded-md">
                <p className="text-amber-700 dark:text-amber-400">
                  Die angegebene Gruppe existiert nicht oder du hast keine Berechtigung, in dieser Gruppe eine Veranstaltung zu erstellen.
                </p>
              </div>
            )}
            
            {preSelectedGroup?.isPrivate && (
              <div className="mb-6 p-4 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 rounded-md">
                <p className="text-blue-700 dark:text-blue-400">
                  <strong>Hinweis:</strong> Du erstellst eine Veranstaltung in einer privaten Gruppe. 
                  Diese Veranstaltung wird nur für Mitglieder der Gruppe sichtbar sein.
                </p>
              </div>
            )}
            
            <CreateEventForm 
              groups={userGroupsWithIsPrivate} 
              locations={locations}
              preselectedGroupId={hasGroupAccess ? groupId : undefined}
              preselectedLocationId={locationId}
              userId={session.user.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 