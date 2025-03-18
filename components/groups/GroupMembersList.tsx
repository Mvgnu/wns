import Image from 'next/image';
import Link from 'next/link';

type Member = {
  id: string;
  name: string | null;
  image: string | null;
};

type GroupMembersListProps = {
  members: Member[];
};

export default function GroupMembersList({ members }: GroupMembersListProps) {
  if (members.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        <p>No members yet.</p>
      </div>
    );
  }

  return (
    <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
      {members.map((member) => (
        <Link key={member.id} href={`/profile/${member.id}`} className="flex flex-col items-center hover:opacity-80 transition">
          <div className="relative h-16 w-16 rounded-full overflow-hidden mb-2">
            <Image
              src={member.image || '/images/default-avatar.png'}
              alt={member.name || 'Anonymous'}
              fill
              className="object-cover"
            />
          </div>
          <span className="text-sm font-medium text-center truncate w-full">
            {member.name || 'Anonymous'}
          </span>
        </Link>
      ))}
    </div>
  );
} 