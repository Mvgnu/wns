"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MultiSelect, OptionType } from "@/components/ui/multi-select";
import ImageUploader from "@/components/ui/ImageUploader";
import { useCreateGroup, useUpdateGroup } from "@/hooks/useGroups";
import { useRouter } from "next/navigation";
import { allSports, getSportsByCategory, sportsCategories } from "@/lib/sportsData";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

// Define the form schema with Zod
const formSchema = z.object({
  name: z.string().min(3, "Name muss mindestens 3 Zeichen lang sein").max(100, "Name darf maximal 100 Zeichen lang sein"),
  description: z.string().max(500, "Beschreibung darf maximal 500 Zeichen lang sein").optional(),
  sports: z.array(z.string()).min(1, "Mindestens eine Sportart ist erforderlich"),
  location: z.string().optional(),
  image: z.string().optional(),
  isPrivate: z.boolean().default(false),
  groupTags: z.string().optional(), // comma-separated for UI, will split into array
  activityLevel: z.enum(["low","medium","high"]).optional(),
  // Replace JSON strings with structured fields
  requireApproval: z.boolean().default(false),
  allowInvites: z.boolean().default(true),
  contentModeration: z.enum(["low", "medium", "high"]).default("medium"),
  allowMemberPosts: z.boolean().default(true),
  allowEventCreation: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface GroupFormProps {
  initialData?: {
    id: string;
    name: string;
    description?: string;
    sport: string; // Old single sport field
    sports?: string[]; // New multi-sport field
    location?: string;
    image?: string;
    isPrivate?: boolean;
  };
  isEditing?: boolean;
}

export default function GroupForm({ initialData, isEditing = false }: GroupFormProps) {
  const router = useRouter();
  const createGroup = useCreateGroup();
  const updateGroup = useUpdateGroup();
  const [images, setImages] = useState<string[]>(initialData?.image ? [initialData.image] : []);
  const [selected, setSelected] = useState<string[]>(initialData?.sports || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Convert sports data to options format for multi-select
  const sportOptions: OptionType[] = allSports.map(sport => ({
    label: sport.label,
    value: sport.value,
    group: sport.category
  }));

  // Initialize with either the sports array or convert the old single sport to an array
  const initialSports = initialData?.sports || 
    (initialData?.sport ? [initialData.sport] : []);

  // Initialize the form with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      sports: initialSports,
      location: initialData?.location || "",
      image: initialData?.image || "",
      isPrivate: initialData?.isPrivate || false,
      groupTags: "",
      activityLevel: undefined,
      // Replace JSON strings with structured fields
      requireApproval: false,
      allowInvites: true,
      contentModeration: "medium",
      allowMemberPosts: true,
      allowEventCreation: true,
    },
  });

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Add the image from the state if available
      if (images.length > 0) {
        values.image = images[0];
        console.log("Setting group image URL:", values.image);
      }

      // For backward compatibility, use the first sport as the main sport
      const primarySport = values.sports[0] || "";

      const payload: any = {
        name: values.name,
        description: values.description,
        sports: values.sports,
        sport: primarySport,
        location: values.location,
        image: values.image,
        isPrivate: values.isPrivate,
      };
      if (values.groupTags && values.groupTags.trim().length > 0) {
        payload.groupTags = values.groupTags.split(',').map(t => t.trim()).filter(Boolean);
      }
      if (values.activityLevel) {
        payload.activityLevel = values.activityLevel;
      }
      // Replace JSON strings with structured fields
      payload.requireApproval = values.requireApproval;
      payload.allowInvites = values.allowInvites;
      payload.contentModeration = values.contentModeration;
      payload.allowMemberPosts = values.allowMemberPosts;
      payload.allowEventCreation = values.allowEventCreation;

      if (isEditing && initialData) {
        updateGroup.mutate({ id: initialData.id, data: payload }, {
          onSuccess: () => { router.push(`/groups/${initialData.id}`); },
          onError: (error) => { setIsSubmitting(false); console.error("Error updating group:", error); }
        });
      } else {
        createGroup.mutate(payload, {
          onSuccess: (newGroup) => {
            if (newGroup && newGroup.id) { router.push(`/groups/${newGroup.id}`); } else { console.error("Missing group ID in response:", newGroup); router.push('/groups'); }
          },
          onError: (error) => { setIsSubmitting(false); console.error("Error creating group:", error); }
        });
      }
    } catch (error) {
      setIsSubmitting(false);
      console.error("Form submission error:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gruppenname</FormLabel>
              <FormControl>
                <Input placeholder="Gib den Namen deiner Gruppe ein" {...field} />
              </FormControl>
              <FormDescription>
                Wähle einen Namen, der den Fokus deiner Gruppe gut repräsentiert.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sports"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sportarten</FormLabel>
              <FormControl>
                <MultiSelect
                  options={sportOptions}
                  selected={field.value}
                  onChange={field.onChange}
                  placeholder="Sportarten auswählen"
                  groupedOptions={true}
                />
              </FormControl>
              <FormDescription>
                Wähle eine oder mehrere Sportarten oder Aktivitäten, auf die sich diese Gruppe konzentriert.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ort (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="z.B. Berlin, Hamburg" {...field} />
              </FormControl>
              <FormDescription>
                Wo ist diese Gruppe hauptsächlich aktiv?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beschreibung (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Beschreibe, worum es in deiner Gruppe geht..." 
                  className="min-h-32" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Gib Details zum Zweck deiner Gruppe, geplanten Aktivitäten und für wen die Gruppe geeignet ist.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="groupTags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="z.B. verein, team, fortgeschritten (kommagetrennt)" {...field} />
              </FormControl>
              <FormDescription>
                Kommagetrennte Liste von Schlagwörtern für die Gruppe.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="activityLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Aktivitätslevel (Optional)</FormLabel>
              <FormControl>
                <select className="border rounded-md h-10 px-3" value={field.value || ''} onChange={(e) => field.onChange(e.target.value || undefined)}>
                  <option value="">Auswählen</option>
                  <option value="low">Niedrig</option>
                  <option value="medium">Mittel</option>
                  <option value="high">Hoch</option>
                </select>
              </FormControl>
              <FormDescription>
                Wie aktiv ist diese Gruppe?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requireApproval"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Eintritt erforderlich</FormLabel>
                <FormDescription>
                  Neue Mitglieder müssen von einem bestehenden Mitglied genehmigt werden.
                </FormDescription>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="allowInvites"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Einladungen erlauben</FormLabel>
                <FormDescription>
                  Neue Mitglieder können sich selbst einladen.
                </FormDescription>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contentModeration"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <select className="border rounded-md h-10 px-3" value={field.value || ''} onChange={(e) => field.onChange(e.target.value || undefined)}>
                  <option value="low">Niedrig</option>
                  <option value="medium">Mittel</option>
                  <option value="high">Hoch</option>
                </select>
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Inhaltsmoderation</FormLabel>
                <FormDescription>
                  Wie streng soll die Inhaltsmoderation sein?
                </FormDescription>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="allowMemberPosts"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Mitglieder dürfen Beiträge erstellen</FormLabel>
                <FormDescription>
                  Mitglieder können ihre eigenen Beiträge erstellen.
                </FormDescription>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="allowEventCreation"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Veranstaltungen erstellen</FormLabel>
                <FormDescription>
                  Mitglieder können ihre eigenen Veranstaltungen erstellen.
                </FormDescription>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isPrivate"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Private Gruppe</FormLabel>
                <FormDescription>
                  Private Gruppen sind nur für Mitglieder sichtbar. Neue Mitglieder können nur über Einladungen oder Anfragen beitreten.
                </FormDescription>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel>Gruppenbild (Optional)</FormLabel>
          <ImageUploader 
            value={images} 
            onChange={setImages} 
            maxFiles={1} 
            folder="groups"
            disabled={createGroup.isPending || updateGroup.isPending || isSubmitting}
          />
          <FormDescription>
            Lade ein Bild hoch, das deine Gruppe repräsentiert. Dieses wird auf der Gruppenseite angezeigt.
          </FormDescription>
        </div>

        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            disabled={createGroup.isPending || updateGroup.isPending || isSubmitting}
          >
            Abbrechen
          </Button>
          <Button 
            type="submit"
            disabled={createGroup.isPending || updateGroup.isPending || isSubmitting}
          >
            {createGroup.isPending || updateGroup.isPending || isSubmitting
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Wird gespeichert...</>
              : isEditing
              ? "Gruppe aktualisieren"
              : "Gruppe erstellen"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 