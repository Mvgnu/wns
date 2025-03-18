"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { Check, Users, X, Loader2 } from "lucide-react";

interface GroupData {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  sport: string;
  isPrivate: boolean;
  _count: {
    members: number;
  };
  owner: {
    id: string;
    name: string;
    image: string | null;
  };
}

export default function JoinGroupPage() {
  const { code } = useParams();
  const router = useRouter();
  const { status, data: session } = useSession();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<GroupData | null>(null);
  const [isMember, setIsMember] = useState(false);
  
  useEffect(() => {
    const validateInvite = async () => {
      if (!code) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/groups/join/${code}`);
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Invalid invitation code");
        }
        
        const data = await response.json();
        setGroup(data.group);
        setIsMember(data.isMember);
      } catch (error: any) {
        setError(error.message || "Could not validate the invitation code");
      } finally {
        setIsLoading(false);
      }
    };
    
    validateInvite();
  }, [code]);
  
  const handleJoinGroup = async () => {
    if (!session?.user) {
      // Redirect to login if not authenticated
      router.push(`/auth/signin?callbackUrl=/groups/join/${code}`);
      return;
    }
    
    try {
      setIsJoining(true);
      const response = await fetch(`/api/groups/join/${code}`, {
        method: "POST",
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to join the group");
      }
      
      const data = await response.json();
      
      toast({
        title: "Successfully joined group",
        description: `You are now a member of ${data.group.name}`,
        variant: "default",
      });
      
      // Redirect to the group page
      router.push(`/groups/${data.group.id}`);
    } catch (error: any) {
      toast({
        title: "Error joining group",
        description: error.message || "Could not join the group. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };
  
  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying invitation...</p>
        </div>
      </div>
    );
  }
  
  if (error || !group) {
    return (
      <div className="container max-w-md mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-red-500">Invalid Invitation</CardTitle>
            <CardDescription className="text-center">
              {error || "This invitation link is invalid or has expired."}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/groups")}>Browse Groups</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container max-w-md mx-auto py-12 px-4">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Avatar className="h-16 w-16">
              {group.image ? (
                <img src={group.image} alt={group.name} />
              ) : (
                <Users className="h-10 w-10" />
              )}
            </Avatar>
          </div>
          <CardTitle className="text-xl">{group.name}</CardTitle>
          <CardDescription>
            {group.isPrivate ? "Private Group" : "Public Group"} • {group.sport}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {group.description && (
            <p className="text-sm text-muted-foreground">{group.description}</p>
          )}
          
          <div className="flex justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 mr-1" /> 
              {group._count.members} members
            </div>
            <div>
              Owner: {group.owner.name}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-4">
          {isMember ? (
            <>
              <div className="text-center text-green-600 font-medium">
                You are already a member of this group
              </div>
              <Button onClick={() => router.push(`/groups/${group.id}`)}>
                Go to Group
              </Button>
            </>
          ) : (
            <>
              <Button 
                className="w-full" 
                onClick={handleJoinGroup}
                disabled={isJoining}
              >
                {isJoining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Join Group
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => router.push("/groups")}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
} 