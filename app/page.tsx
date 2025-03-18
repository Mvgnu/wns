// No 'use server' here - this is a component file

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { sportsCategories } from '@/lib/sportsData';
import HomePageClient from '@/components/home/HomePageClient';
import { getHomePageData } from '@/lib/dataServices';

// This makes Next.js always render the page on the server
export const dynamic = 'force-dynamic';

// Define types for our data structure
interface CategoryHighlight {
  topGroup: {
    id: string;
    name: string;
    createdAt: Date | string | null;
    updatedAt: Date | string | null;
    _count: {
      members: number;
    };
    [key: string]: any;
  } | null;
  upcomingEvent: {
    id: string;
    title: string;
    startTime: Date | string;
    endTime: Date | string | null;
    createdAt: Date | string | null;
    updatedAt: Date | string | null;
    group: {
      id: string;
      name: string;
      createdAt: Date | string | null;
      updatedAt: Date | string | null;
      [key: string]: any;
    } | null;
    [key: string]: any;
  } | null;
}

// Homepage component - this will be server-side rendered
export default async function Home() {
  // Server-side data fetching
  const data = await getHomePageData();

  // Serialize the data to make it safe for client rendering
  // Using a typed approach to ensure proper serialization
  const serializedData = {
    sportsByCategory: data.sportsByCategory,
    groupsCount: data.groupsCount,
    locationsCount: data.locationsCount,
    usersCount: data.usersCount,
    // Serialize complex Date objects in the data
    categoryHighlights: Object.fromEntries(
      Object.entries(data.categoryHighlights).map(([category, highlight]) => {
        const typedHighlight = highlight as CategoryHighlight;
        return [
          category,
          {
            topGroup: typedHighlight.topGroup ? {
              ...typedHighlight.topGroup,
              createdAt: typedHighlight.topGroup.createdAt?.toString(),
              updatedAt: typedHighlight.topGroup.updatedAt?.toString(),
            } : null,
            upcomingEvent: typedHighlight.upcomingEvent ? {
              ...typedHighlight.upcomingEvent,
              startTime: typedHighlight.upcomingEvent.startTime?.toString(),
              endTime: typedHighlight.upcomingEvent.endTime?.toString(),
              createdAt: typedHighlight.upcomingEvent.createdAt?.toString(),
              updatedAt: typedHighlight.upcomingEvent.updatedAt?.toString(),
              group: typedHighlight.upcomingEvent.group ? {
                ...typedHighlight.upcomingEvent.group,
                createdAt: typedHighlight.upcomingEvent.group.createdAt?.toString(),
                updatedAt: typedHighlight.upcomingEvent.group.updatedAt?.toString(),
              } : undefined
            } : null
          }
        ];
      })
    )
  };

  // Render the home page with our client component that receives serialized data
  return <HomePageClient 
    sportsByCategory={serializedData.sportsByCategory}
    groupsCount={serializedData.groupsCount}
    locationsCount={serializedData.locationsCount}
    usersCount={serializedData.usersCount}
    categoryHighlights={serializedData.categoryHighlights}
  />;
}
