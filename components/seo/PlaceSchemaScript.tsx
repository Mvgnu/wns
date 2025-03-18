export default function PlaceSchemaScript({
  name,
  description,
  url,
  address,
  latitude,
  longitude,
  type,
  sport,
  rating,
  imageUrl,
  reviews = [],
}: {
  name: string;
  description: string;
  url: string;
  address?: string;
  latitude: number;
  longitude: number;
  type: string;
  sport: string;
  rating?: number;
  imageUrl?: string;
  reviews?: Array<{
    author: string;
    rating: number;
    comment?: string;
    date: string;
  }>;
}) {
  // Define types for the schema
  interface Review {
    "@type": string;
    author: {
      "@type": string;
      name: string;
    };
    reviewRating: {
      "@type": string;
      ratingValue: number;
    };
    datePublished: string;
    reviewBody?: string;
  }

  interface PlaceSchema {
    "@context": string;
    "@type": string;
    name: string;
    description: string;
    url: string;
    geo: {
      "@type": string;
      latitude: number;
      longitude: number;
    };
    category: string[];
    address?: {
      "@type": string;
      streetAddress: string;
    };
    aggregateRating?: {
      "@type": string;
      ratingValue: number;
      reviewCount: number;
    };
    image?: string;
    review?: Review[];
  }

  // Create the schema structure according to schema.org
  const schema: PlaceSchema = {
    "@context": "https://schema.org",
    "@type": "Place",
    "name": name,
    "description": description,
    "url": url,
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": latitude,
      "longitude": longitude
    },
    "category": [type, sport],
  };

  // Add address if available
  if (address) {
    schema.address = {
      "@type": "PostalAddress",
      "streetAddress": address
    };
  }

  // Add aggregateRating if available
  if (rating) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": rating,
      "reviewCount": reviews.length
    };
  }

  // Add image if available
  if (imageUrl) {
    schema.image = imageUrl;
  }

  // Add reviews if available
  if (reviews.length > 0) {
    schema.review = reviews.map(review => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": review.author
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating
      },
      "datePublished": review.date,
      "reviewBody": review.comment
    }));
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
} 