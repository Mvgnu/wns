'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSession } from 'next-auth/react';
import { registerPlugin } from 'react-filepond';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/ui/RichTextEditor';
import MediaUploader from '@/components/ui/MediaUploader';
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

// Register FilePond plugins
registerPlugin(FilePondPluginImagePreview, FilePondPluginFileValidateType);

// Define form schema
const formSchema = z.object({
  title: z.string().min(3, 'Titel muss mindestens 3 Zeichen lang sein').max(100, 'Titel darf nicht länger als 100 Zeichen sein'),
  content: z.string().min(10, 'Inhalt muss mindestens 10 Zeichen lang sein'),
  groupId: z.string().optional(),
});

// Define types
type FormValues = z.infer<typeof formSchema>;

type Group = {
  id: string;
  name: string;
  sport: string;
};

type MediaFile = {
  source: string;
  file: File;
};

export default function CreatePostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams?.get('groupId');

  const [groups, setGroups] = useState<Group[]>([]);
  const [images, setImages] = useState<MediaFile[]>([]);
  const [videos, setVideos] = useState<MediaFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      groupId: groupId || '',
    },
  });

  // Detect dark mode
  useEffect(() => {
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(isDark);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Fetch groups the user is a member of
  useEffect(() => {
    if (session?.user) {
      fetch('/api/groups/my-groups')
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch groups: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            setGroups(data);
          } else {
            console.error('Unexpected API response:', data);
            setGroups([]);
          }
        })
        .catch((err) => {
          console.error('Error loading groups:', err);
          setGroups([]);
        });
    }
  }, [session]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/posts/create');
    }
  }, [status, router]);

  // In CreatePostPage
  const handleEditorChange = useCallback((content: string) => {
    setValue('content', content);
  }, [setValue]);


  const onSubmit = async (data: FormValues) => {
    if (status !== 'authenticated') return;

    setIsSubmitting(true);

    try {
      // Store uploaded images directly to the /uploads/images directory
      const imageUrls = await Promise.all(
        images.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file.file);
          
          const uploadResponse = await fetch('/api/upload?type=image', {
            method: 'POST',
            body: formData,
          });
          
          if (!uploadResponse.ok) {
            throw new Error('Failed to upload image');
          }
          
          const uploadResult = await uploadResponse.json();
          return uploadResult.url; // Should return a path like /uploads/images/filename.jpg
        })
      );

      // For videos, we only allow embedding URLs, not uploading
      const videoUrls = videos.map(video => video.source);

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          groupId: data.groupId || null,
          images: imageUrls,
          videos: videoUrls,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Beitrag erfolgreich erstellt!');
        router.push(`/posts/${result.slug || result.id}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Fehler beim Erstellen des Beitrags');
      }
    } catch (error) {
      console.error('Fehler beim Übermitteln des Beitrags:', error);
      toast.error('Beim Erstellen des Beitrags ist ein Fehler aufgetreten');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return <div className="container mx-auto py-8 text-center">Wird geladen...</div>;
  }

  if (status === 'unauthenticated') {
    return null; // Redirect handled in useEffect
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Neuen Beitrag erstellen</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="title">Titel</Label>
                <Input
                  id="title"
                  {...register('title')}
                  className="mt-1"
                  placeholder="Gib einen Titel für deinen Beitrag ein"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="groupId">In Gruppe posten (optional)</Label>
                <select
                  id="groupId"
                  {...register('groupId')}
                  className="w-full mt-1 bg-background text-foreground rounded-md border border-input py-2 px-3"
                >
                  <option value="">Gruppe auswählen (optional)</option>
                  {Array.isArray(groups) && groups.length > 0 ? (
                    groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name} ({group.sport})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Wird geladen oder keine Gruppen gefunden</option>
                  )}
                </select>
                {groups.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Du bist noch in keiner Gruppe Mitglied. <Link href="/groups" className="text-primary hover:underline">Gruppen entdecken</Link>
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="content">Inhalt</Label>
                <div className="mt-1 rounded-md border border-input overflow-hidden p-4">
                <RichTextEditor
                  id="post-content-editor"
                  defaultValue=""
                  onChange={handleEditorChange}
                  placeholder="Verfasse hier den Inhalt deines Beitrags..."
                  dark={false}
                  autoFocus
                />
                </div>
                {errors.content && (
                  <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
                )}
              </div>

              <div>
                <Label>Bilder</Label>
                <MediaUploader
                  files={images}
                  onupdatefiles={setImages}
                  allowMultiple={true}
                  maxFiles={5}
                  acceptedFileTypes={['image/*']}
                  labelIdle='Bilder hierher ziehen oder <span class="filepond--label-action">durchsuchen</span>'
                />
              </div>

              <div>
                <Label>Videos</Label>
                <div className="mb-2">
                  <p className="text-sm text-gray-500">Bitte gib nur Video-URLs ein (z.B. YouTube oder Vimeo). Direktes Hochladen von Videos ist nicht möglich.</p>
                </div>
                <MediaUploader
                  files={videos}
                  onupdatefiles={setVideos}
                  allowMultiple={true}
                  maxFiles={2}
                  acceptedFileTypes={['text/url']}
                  labelIdle='Video-URLs eingeben oder <span class="filepond--label-action">URLs einfügen</span>'
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Abbrechen
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Wird erstellt...' : 'Beitrag erstellen'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}