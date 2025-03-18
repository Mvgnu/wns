export default function ForumSchemaScript({ 
  name, 
  description, 
  url,
  postsCount,
  lastPostDate,
  imageUrl,
}: {
  name: string;
  description: string;
  url: string;
  postsCount: number;
  lastPostDate: string;
  imageUrl?: string;
}) {
  // Create the schema structure according to schema.org
  interface ForumSchema {
    "@context": string;
    "@type": string;
    headline: string;
    description: string;
    url: string;
    datePublished: string;
    commentCount: number;
    author: {
      "@type": string;
      name: string;
      url: string;
    };
    image?: string;
  }

  // Create the schema structure according to schema.org
  const schema: ForumSchema = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    "headline": name,
    "description": description,
    "url": url,
    "datePublished": lastPostDate,
    "commentCount": postsCount,
    "author": {
      "@type": "Organization",
      "name": "WNS Community",
      "url": "https://wns-community.com"
    }
  };

  // Add image if available
  if (imageUrl) {
    schema.image = imageUrl;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
} 