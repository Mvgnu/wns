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
  sport: string;
  label: string;
  description: string;
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
    sportImages: data.sportImages || {}, // Include the static sport images
    // Serialize complex Date objects in the data
    categoryHighlights: Object.fromEntries(
      Object.entries(data.categoryHighlights).map(([category, highlights]) => {
        // Ensure highlights is an array
        const highlightsArray = Array.isArray(highlights) ? highlights : [];
        
        // Serialize each highlight in the array
        const serializedHighlights = highlightsArray.map((highlight: CategoryHighlight) => {
          return {
            sport: highlight.sport,
            label: highlight.label,
            description: highlight.description,
            topGroup: highlight.topGroup ? {
              ...highlight.topGroup,
              createdAt: highlight.topGroup.createdAt?.toString(),
              updatedAt: highlight.topGroup.updatedAt?.toString(),
            } : null,
            upcomingEvent: highlight.upcomingEvent ? {
              ...highlight.upcomingEvent,
              startTime: highlight.upcomingEvent.startTime?.toString(),
              endTime: highlight.upcomingEvent.endTime?.toString(),
              createdAt: highlight.upcomingEvent.createdAt?.toString(),
              updatedAt: highlight.upcomingEvent.updatedAt?.toString(),
              group: highlight.upcomingEvent.group ? {
                ...highlight.upcomingEvent.group,
                createdAt: highlight.upcomingEvent.group.createdAt?.toString(),
                updatedAt: highlight.upcomingEvent.group.updatedAt?.toString(),
              } : null
            } : null
          };
        });
        
        return [category, serializedHighlights];
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
    sportImages={serializedData.sportImages}
  />;
}
