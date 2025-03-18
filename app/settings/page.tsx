'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import ImageUploader from '@/components/ui/ImageUploader';

// Define profile schema
const profileSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein').max(100, 'Name darf maximal 100 Zeichen lang sein'),
  bio: z.string().max(500, 'Bio darf maximal 500 Zeichen lang sein').optional(),
  location: z.string().max(100, 'Ort darf maximal 100 Zeichen lang sein').optional(),
});

// Define notification settings schema
const notificationSchema = z.object({
  emailNotifications: z.boolean().default(true),
  groupInvites: z.boolean().default(true),
  eventReminders: z.boolean().default(true),
  newMessages: z.boolean().default(true),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type NotificationFormValues = z.infer<typeof notificationSchema>;

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/settings');
    }
  }, [status, router]);

  // Initialize form with user data
  useEffect(() => {
    if (session?.user) {
      profileForm.reset({
        name: session.user.name || '',
        bio: (session.user as any).bio || '',
        location: (session.user as any).location || '',
      });

      if (session.user.image) {
        setProfileImage([session.user.image]);
      }

      // Load notification settings
      // This would be populated from the API in a real application
      notificationForm.reset({
        emailNotifications: true,
        groupInvites: true,
        eventReminders: true,
        newMessages: true,
      });
    }
  }, [session]);

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      bio: '',
      location: '',
    },
  });

  // Notification form
  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      groupInvites: true,
      eventReminders: true,
      newMessages: true,
    },
  });

  // Handle profile submit
  const handleProfileSubmit = async (data: ProfileFormValues) => {
    if (!session?.user) return;
    
    setIsLoading(true);
    
    try {
      const profileData = {
        ...data,
        image: profileImage.length > 0 ? profileImage[0] : session.user.image,
        userId: session.user.id,
      };
      
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Aktualisieren des Profils');
      }
      
      // Update session with new data
      await update({
        ...session,
        user: {
          ...session.user,
          ...profileData,
        },
      });
      
      toast({
        title: 'Profil aktualisiert',
        description: 'Dein Profil wurde erfolgreich aktualisiert',
        variant: 'default',
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Profils:', error);
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Fehler beim Aktualisieren des Profils',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle notification settings submit
  const handleNotificationSubmit = async (data: NotificationFormValues) => {
    setIsLoading(true);
    
    try {
      // In a real application, you would save these settings to the backend
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      
      toast({
        title: 'Benachrichtigungseinstellungen aktualisiert',
        description: 'Deine Benachrichtigungspräferenzen wurden gespeichert',
        variant: 'default',
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Benachrichtigungseinstellungen:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Aktualisieren der Benachrichtigungseinstellungen',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!confirm('Bist du sicher, dass du dein Konto löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/profile', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Löschen des Kontos');
      }
      
      // Sign out and redirect
      router.push('/auth/signin');
    } catch (error) {
      console.error('Fehler beim Löschen des Kontos:', error);
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Fehler beim Löschen des Kontos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="container mx-auto py-8 text-center">Wird geladen...</div>;
  }

  if (status === 'unauthenticated') {
    return null; // We'll redirect in the useEffect
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Kontoeinstellungen</h1>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
            <TabsTrigger value="account">Konto</TabsTrigger>
          </TabsList>
          
          {/* Profile Settings */}
          <TabsContent value="profile">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Profilinformationen</h2>
              
              <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
                <div>
                  <Label htmlFor="profileImage">Profilbild</Label>
                  <div className="mt-2">
                    <ImageUploader
                      value={profileImage}
                      onChange={setProfileImage}
                      maxFiles={1}
                      folder="avatars"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    {...profileForm.register('name')}
                    className="mt-1"
                  />
                  {profileForm.formState.errors.name && (
                    <p className="text-red-500 text-sm mt-1">{profileForm.formState.errors.name.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    {...profileForm.register('bio')}
                    className="mt-1"
                    rows={4}
                  />
                  {profileForm.formState.errors.bio && (
                    <p className="text-red-500 text-sm mt-1">{profileForm.formState.errors.bio.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="location">Ort</Label>
                  <Input
                    id="location"
                    {...profileForm.register('location')}
                    className="mt-1"
                  />
                  {profileForm.formState.errors.location && (
                    <p className="text-red-500 text-sm mt-1">{profileForm.formState.errors.location.message}</p>
                  )}
                </div>
                
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Wird aktualisiert...' : 'Profil aktualisieren'}
                </Button>
              </form>
            </div>
          </TabsContent>
          
          {/* Notification Settings */}
          <TabsContent value="notifications">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Benachrichtigungseinstellungen</h2>
              
              <form onSubmit={notificationForm.handleSubmit(handleNotificationSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailNotifications" className="font-medium">E-Mail-Benachrichtigungen</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Erhalte wichtige Updates per E-Mail</p>
                    </div>
                    <input
                      type="checkbox"
                      id="emailNotifications"
                      {...notificationForm.register('emailNotifications')}
                      className="toggle"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="groupInvites" className="font-medium">Gruppeneinladungen</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Benachrichtigungen über neue Gruppeneinladungen</p>
                    </div>
                    <input
                      type="checkbox"
                      id="groupInvites"
                      {...notificationForm.register('groupInvites')}
                      className="toggle"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="eventReminders" className="font-medium">Veranstaltungserinnerungen</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Erinnerungen für bevorstehende Veranstaltungen</p>
                    </div>
                    <input
                      type="checkbox"
                      id="eventReminders"
                      {...notificationForm.register('eventReminders')}
                      className="toggle"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="newMessages" className="font-medium">Neue Nachrichten</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Benachrichtigungen über neue Nachrichten</p>
                    </div>
                    <input
                      type="checkbox"
                      id="newMessages"
                      {...notificationForm.register('newMessages')}
                      className="toggle"
                    />
                  </div>
                </div>
                
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Wird gespeichert...' : 'Einstellungen speichern'}
                </Button>
              </form>
            </div>
          </TabsContent>
          
          {/* Account Settings */}
          <TabsContent value="account">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Kontoeinstellungen</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Passwort ändern</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Regelmäßiges Ändern deines Passworts erhöht die Sicherheit deines Kontos.
                  </p>
                  <Button variant="outline">
                    Passwort ändern
                  </Button>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-2 text-red-600 dark:text-red-400">Konto löschen</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Lösche dein Konto und alle damit verbundenen Daten dauerhaft. Diese Aktion kann nicht rückgängig gemacht werden.
                  </p>
                  <Button variant="destructive" onClick={handleDeleteAccount} disabled={isLoading}>
                    {isLoading ? 'Wird verarbeitet...' : 'Konto löschen'}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 