"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import ImageUploader from "@/components/ui/ImageUploader";
import { useCreatePost, useUpdatePost } from "@/hooks/usePosts";
import { useGroups } from "@/hooks/useGroups";
import { useRouter } from "next/navigation";

// Define the form schema with Zod
const formSchema = z.object({
  title: z.string().min(3, "Titel muss mindestens 3 Zeichen lang sein").max(100, "Titel darf maximal 100 Zeichen lang sein"),
  content: z.string().min(10, "Inhalt muss mindestens 10 Zeichen lang sein"),
  groupId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PostFormProps {
  initialData?: {
    id: string;
    title: string;
    content: string;
    images: string[];
    videos: string[];
    groupId?: string;
  };
  isEditing?: boolean;
}

export default function PostForm({ initialData, isEditing = false }: PostFormProps) {
  const router = useRouter();
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const { data: groups } = useGroups();
  const [media, setMedia] = useState<string[]>(initialData ? [...initialData.images, ...initialData.videos] : []);

  // Initialize the form with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      content: initialData?.content || "",
      groupId: initialData?.groupId || "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    // Separate images and videos
    const images: string[] = [];
    const videos: string[] = [];
    
    media.forEach(url => {
      if (url.includes('/video/') || url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov')) {
        videos.push(url);
      } else {
        images.push(url);
      }
    });

    const postData = {
      ...values,
      images,
      videos,
    };

    if (isEditing && initialData) {
      // Update existing post
      updatePost.mutate({
        id: initialData.id,
        data: postData,
      }, {
        onSuccess: () => {
          router.push(`/posts/${initialData.slug || initialData.id}`);
        },
      });
    } else {
      // Create new post
      createPost.mutate(postData as any, {
        onSuccess: (newPost) => {
          router.push(`/posts/${newPost.slug || newPost.id}`);
        },
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beitragstitel</FormLabel>
              <FormControl>
                <Input placeholder="Titel des Beitrags eingeben" {...field} />
              </FormControl>
              <FormDescription>
                Wähle einen klaren und aussagekräftigen Titel für deinen Beitrag.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="groupId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gruppe (Optional)</FormLabel>
              <FormControl>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...field}
                >
                  <option value="">In deinem Profil veröffentlichen</option>
                  {groups?.map((group) => (
                    <option key={group.id} value={group.id}>
                      In {group.name} veröffentlichen
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormDescription>
                Wähle aus, wo du diesen Inhalt veröffentlichen möchtest. Wenn keine Gruppe ausgewählt ist, wird er in deinem Profil veröffentlicht.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Inhalt</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Schreibe den Inhalt deines Beitrags..." 
                  className="min-h-40" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Teile deine Gedanken, Erfahrungen oder Fragen mit der Community.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel>Medien (Optional)</FormLabel>
          <ImageUploader 
            value={media} 
            onChange={setMedia} 
            maxFiles={10} 
            folder="posts"
            disabled={createPost.isPending || updatePost.isPending}
          />
          <FormDescription>
            Lade Bilder oder Videos hoch, um sie in deinen Beitrag einzufügen. Du kannst bis zu 10 Dateien hinzufügen.
          </FormDescription>
        </div>

        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            disabled={createPost.isPending || updatePost.isPending}
          >
            Abbrechen
          </Button>
          <Button 
            type="submit"
            disabled={createPost.isPending || updatePost.isPending}
          >
            {createPost.isPending || updatePost.isPending
              ? "Wird gespeichert..."
              : isEditing
              ? "Beitrag aktualisieren"
              : "Beitrag erstellen"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 