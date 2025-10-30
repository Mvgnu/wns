'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { X, Image as ImageIcon, Video, Send, Users, Map, Calendar } from 'lucide-react';

// Types for target selection
type TargetEntityType = 'user' | 'group' | 'location' | 'event';
type TargetEntity = {
  id: string;
  name: string;
  image?: string | null;
  type: TargetEntityType;
};

interface CreateFeedPostFormProps {
  onSuccess?: () => void;
  defaultTargets?: TargetEntity[];
  preselectedTargetType?: TargetEntityType;
  preselectedTargetId?: string;
}

export default function CreateFeedPostForm({
  onSuccess,
  defaultTargets = [],
  preselectedTargetType,
  preselectedTargetId
}: CreateFeedPostFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Targets selection state
  const [selectedTargets, setSelectedTargets] = useState<TargetEntity[]>(defaultTargets);
  const [activeTab, setActiveTab] = useState<string>(preselectedTargetType || 'user');
  
  // State for available entities to select from
  const [availableGroups, setAvailableGroups] = useState<TargetEntity[]>([]);
  const [availableLocations, setAvailableLocations] = useState<TargetEntity[]>([]);
  const [availableEvents, setAvailableEvents] = useState<TargetEntity[]>([]);
  
  // Add current user as a default target if no defaults provided
  useEffect(() => {
    if (session?.user && selectedTargets.length === 0) {
      const userTarget: TargetEntity = {
        id: session.user.id,
        name: session.user.name || 'Your Feed',
        image: session.user.image,
        type: 'user'
      };
      
      setSelectedTargets([userTarget]);
    }
    
    // If a preselected target is specified, fetch and add it
    if (preselectedTargetType && preselectedTargetId && !defaultTargets.length) {
      fetchPreselectedTarget();
    }
  }, [session, preselectedTargetId, preselectedTargetType]);
  
  // Fetch groups, locations, and events the user has access to
  useEffect(() => {
    if (session?.user) {
      // Only fetch if the user is authenticated
      fetchGroups();
      fetchLocations();
      fetchEvents();
    }
  }, [session]);
  
  // Fetch preselected target if specified
  const fetchPreselectedTarget = async () => {
    if (!preselectedTargetType || !preselectedTargetId) return;
    
    try {
      let endpoint = '';
      
      if (preselectedTargetType === 'group') {
        endpoint = `/api/groups/${preselectedTargetId}`;
      } else if (preselectedTargetType === 'location') {
        endpoint = `/api/locations/${preselectedTargetId}`;
      } else if (preselectedTargetType === 'event') {
        endpoint = `/api/events/${preselectedTargetId}`;
      } else {
        return; // Skip for user type or unknown types
      }
      
      const response = await fetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        const entity = data[preselectedTargetType] || data;
        
        // Format based on entity type
        let targetEntity: TargetEntity;
        
        if (preselectedTargetType === 'group') {
          targetEntity = {
            id: entity.id,
            name: entity.name,
            image: entity.image,
            type: 'group'
          };
        } else if (preselectedTargetType === 'location') {
          targetEntity = {
            id: entity.id,
            name: entity.name,
            image: entity.images?.[0] || null,
            type: 'location'
          };
        } else if (preselectedTargetType === 'event') {
          targetEntity = {
            id: entity.id,
            name: entity.title,
            image: entity.image,
            type: 'event'
          };
        } else {
          return;
        }
        
        // Add to selected targets if not already included
        if (!selectedTargets.some(t => t.id === targetEntity.id && t.type === targetEntity.type)) {
          setSelectedTargets(prev => [...prev, targetEntity]);
        }
      }
    } catch (error) {
      console.error(`Failed to fetch preselected ${preselectedTargetType}:`, error);
    }
  };
  
  // Fetch groups the user is a member of
  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups/member');
      
      if (response.ok) {
        const data = await response.json();
        const groups: TargetEntity[] = data.groups.map((group: any) => ({
          id: group.id,
          name: group.name,
          image: group.image,
          type: 'group'
        }));
        
        setAvailableGroups(groups);
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    }
  };
  
  // Fetch public locations and locations the user manages
  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations/accessible');
      
      if (response.ok) {
        const data = await response.json();
        const locations: TargetEntity[] = data.locations.map((location: any) => ({
          id: location.id,
          name: location.name,
          image: location.images?.[0] || null,
          type: 'location'
        }));
        
        setAvailableLocations(locations);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };
  
  // Fetch events the user is organizing or attending
  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events/participating');
      
      if (response.ok) {
        const data = await response.json();
        const events: TargetEntity[] = data.events.map((event: any) => ({
          id: event.id,
          name: event.title,
          image: event.image,
          type: 'event'
        }));
        
        setAvailableEvents(events);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };
  
  // Toggle selection of a target
  const toggleTarget = (target: TargetEntity) => {
    setSelectedTargets(prev => {
      const exists = prev.some(t => t.id === target.id && t.type === target.type);
      
      if (exists) {
        return prev.filter(t => !(t.id === target.id && t.type === target.type));
      } else {
        return [...prev, target];
      }
    });
  };
  
  // Remove a selected target
  const removeTarget = (target: TargetEntity) => {
    setSelectedTargets(prev => prev.filter(t => !(t.id === target.id && t.type === target.type)));
  };
  
  // Check if a target is selected
  const isTargetSelected = (target: TargetEntity) => {
    return selectedTargets.some(t => t.id === target.id && t.type === target.type);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      toast({
        title: "Not logged in",
        description: "You must be logged in to post",
        variant: "destructive"
      });
      router.push('/auth/signin');
      return;
    }
    
    if (title.trim() === '' || content.trim() === '') {
      toast({
        title: "Missing fields",
        description: "Title and content are required",
        variant: "destructive"
      });
      return;
    }
    
    if (selectedTargets.length === 0) {
      toast({
        title: "No targets selected",
        description: "Please select at least one feed to post to",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/feed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          content,
          imageUrl: imageUrl || null,
          videoUrl: videoUrl || null,
          targets: selectedTargets.map(target => ({
            targetType: target.type,
            targetId: target.id
          }))
        })
      });
      
      if (response.ok) {
        toast({
          title: "Post created",
          description: "Your post has been published successfully",
          variant: "default"
        });
        
        // Reset form
        setTitle('');
        setContent('');
        setImageUrl('');
        setVideoUrl('');
        setShowImageInput(false);
        setShowVideoInput(false);
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
        
        // Refresh the page to show the new post
        router.refresh();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create post",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If user is not logged in, show a message
  if (!session?.user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center">
            Please <a href="/auth/signin" className="text-blue-500 hover:underline">sign in</a> to create a post
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Post</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Post title and content */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Post Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={100}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="What's on your mind?"
              value={content}
              onChange={e => setContent(e.target.value)}
              maxLength={1000}
              required
              className="min-h-[100px]"
            />
          </div>
          
          {/* Media inputs (optional) */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowImageInput(!showImageInput);
                if (showVideoInput && !showImageInput) setShowVideoInput(false);
              }}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              {showImageInput ? 'Remove Image' : 'Add Image'}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowVideoInput(!showVideoInput);
                if (showImageInput && !showVideoInput) setShowImageInput(false);
              }}
            >
              <Video className="h-4 w-4 mr-2" />
              {showVideoInput ? 'Remove Video' : 'Add Video'}
            </Button>
          </div>
          
          {showImageInput && (
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
              />
            </div>
          )}
          
          {showVideoInput && (
            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL (YouTube or Vimeo)</Label>
              <Input
                id="videoUrl"
                placeholder="https://youtube.com/watch?v=..."
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
              />
            </div>
          )}
          
          {/* Selected targets */}
          <div className="mt-4">
            <Label>Posting to:</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedTargets.map(target => (
                <div
                  key={`${target.type}-${target.id}`}
                  className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full text-sm"
                >
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={target.image || undefined} />
                    <AvatarFallback>{target.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{target.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 rounded-full"
                    onClick={() => removeTarget(target)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          
          {/* Target selection */}
          <div className="mt-4">
            <Label>Add to more feeds:</Label>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="group">
                  <Users className="h-4 w-4 mr-2" />
                  Groups
                </TabsTrigger>
                <TabsTrigger value="location">
                  <Map className="h-4 w-4 mr-2" />
                  Locations
                </TabsTrigger>
                <TabsTrigger value="event">
                  <Calendar className="h-4 w-4 mr-2" />
                  Events
                </TabsTrigger>
              </TabsList>
              
              {/* Groups tab */}
              <TabsContent value="group" className="max-h-[200px] overflow-y-auto">
                {availableGroups.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">You are not a member of any groups.</p>
                ) : (
                  <div className="space-y-2">
                    {availableGroups.map(group => (
                      <div key={group.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`group-${group.id}`}
                          checked={isTargetSelected(group)}
                          onCheckedChange={() => toggleTarget(group)}
                        />
                        <Label htmlFor={`group-${group.id}`} className="flex items-center gap-2 cursor-pointer">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={group.image || undefined} />
                            <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{group.name}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {/* Locations tab */}
              <TabsContent value="location" className="max-h-[200px] overflow-y-auto">
                {availableLocations.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No locations available.</p>
                ) : (
                  <div className="space-y-2">
                    {availableLocations.map(location => (
                      <div key={location.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`location-${location.id}`}
                          checked={isTargetSelected(location)}
                          onCheckedChange={() => toggleTarget(location)}
                        />
                        <Label htmlFor={`location-${location.id}`} className="flex items-center gap-2 cursor-pointer">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={location.image || undefined} />
                            <AvatarFallback>{location.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{location.name}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {/* Events tab */}
              <TabsContent value="event" className="max-h-[200px] overflow-y-auto">
                {availableEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">You have no upcoming events.</p>
                ) : (
                  <div className="space-y-2">
                    {availableEvents.map(event => (
                      <div key={event.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`event-${event.id}`}
                          checked={isTargetSelected(event)}
                          onCheckedChange={() => toggleTarget(event)}
                        />
                        <Label htmlFor={`event-${event.id}`} className="flex items-center gap-2 cursor-pointer">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={event.image || undefined} />
                            <AvatarFallback>{event.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{event.name}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Posting...' : 'Post'}
            <Send className="h-4 w-4 ml-2" />
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 