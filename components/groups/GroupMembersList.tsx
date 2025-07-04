import Image from 'next/image';
import Link from 'next/link';
import { EyeOffIcon, User2Icon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Member = {
  id: string;
  name: string | null;
  image: string | null;
  isAnonymous?: boolean;
};

type GroupMembersListProps = {
  members: Member[];
  currentUserId?: string;
  isGroupAdmin?: boolean;
};

export default function GroupMembersList({ 
  members, 
  currentUserId, 
  isGroupAdmin = false 
}: GroupMembersListProps) {
  if (members.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        <p>No members yet.</p>
      </div>
    );
  }

  return (
    <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
      {members.map((member) => {
        // Show real profile if:
        // 1. Member is not anonymous, OR
        // 2. Current user is the member themselves, OR
        // 3. Current user is a group admin
        const showRealProfile = !member.isAnonymous || 
                               member.id === currentUserId || 
                               isGroupAdmin;
        
        const profileComponent = (
          <div className="flex flex-col items-center hover:opacity-80 transition">
            <div className="relative h-16 w-16 rounded-full overflow-hidden mb-2">
              {showRealProfile ? (
                <Image
                  src={member.image || '/images/default-avatar.png'}
                  alt={member.name || 'Anonymous'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="bg-gray-200 dark:bg-gray-700 h-full w-full flex items-center justify-center">
                  <User2Icon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                </div>
              )}
              {member.isAnonymous && (
                <div className="absolute bottom-0 right-0 bg-gray-100 dark:bg-gray-800 rounded-full p-0.5">
                  <EyeOffIcon className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300" />
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-center truncate w-full">
              {showRealProfile ? (member.name || 'Anonymous') : 'Anonymes Mitglied'}
            </span>
          </div>
        );
        
        return (
          <TooltipProvider key={member.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                {showRealProfile ? (
                  <Link href={`/profile/${member.id}`}>
                    {profileComponent}
                  </Link>
                ) : (
                  <div>{profileComponent}</div>
                )}
              </TooltipTrigger>
              <TooltipContent>
                {member.isAnonymous ? (
                  showRealProfile ? (
                    <span>Anonymes Mitglied (sichtbar nur für dich)</span>
                  ) : (
                    <span>Anonymes Mitglied</span>
                  )
                ) : (
                  <span>{member.name || 'Anonymous'}</span>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
} 