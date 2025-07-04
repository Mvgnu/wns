import { Metadata } from 'next';
import AdminClaimsList from './components/AdminClaimsList';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Place Claims Administration',
  description: 'Review and manage place ownership claims',
};

async function getPlaceClaims() {
  try {
    const claims = await prisma.placeClaim.findMany({
      orderBy: [
        { status: 'asc' }, // pending first
        { createdAt: 'desc' }, // newest first
      ],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            placeType: true,
            detailType: true,
            images: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    return claims;
  } catch (error) {
    console.error('Error fetching place claims:', error);
    return [];
  }
}

export default async function PlaceClaimsAdminPage() {
  // Verify the user has admin access
  const session = await getServerSession(authOptions);
  
  if (!session?.user || !session.user.isAdmin) {
    redirect('/unauthorized');
  }
  
  const claims = await getPlaceClaims();
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Place Claims Administration</h1>
      <AdminClaimsList initialClaims={claims} />
    </div>
  );
} 