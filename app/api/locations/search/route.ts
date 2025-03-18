export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// OpenStreetMap Nominatim API endpoint
const NOMINATIM_API = "https://nominatim.openstreetmap.org/search";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    // Build the search URL
    let searchUrl = `${NOMINATIM_API}?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=10`;
    
    // Add user location for better results if available
    if (lat && lon) {
      searchUrl += `&lat=${lat}&lon=${lon}`;
    }
    
    // Add country bias for Germany
    searchUrl += "&countrycodes=de";

    // Make the request to Nominatim API
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "WNS Community App",
        "Accept-Language": "de",
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform the results to our format
    const results = data.map((item: any) => ({
      id: item.place_id.toString(),
      name: item.display_name.split(",")[0],
      address: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    }));

    return NextResponse.json({
      results,
    });
  } catch (error) {
    console.error("Error searching locations:", error);
    return NextResponse.json(
      { error: "Failed to search locations" },
      { status: 500 }
    );
  }
} 