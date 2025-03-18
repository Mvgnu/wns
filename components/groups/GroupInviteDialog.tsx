"use client"

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus, Search, Check, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface User {
  id: string;
  name: string;
  image: string | null;
}

interface GroupInviteDialogProps {
  groupId: string;
  groupName: string;
}

export default function GroupInviteDialog({ groupId, groupName }: GroupInviteDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [invitingUsers, setInvitingUsers] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?type=users&query=${encodeURIComponent(searchTerm)}`);
      
      if (!response.ok) {
        throw new Error("Failed to search users");
      }
      
      const data = await response.json();
      setSearchResults(data.users || []);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search failed",
        description: "Could not search for users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleInviteUser = async (userId: string, userName: string) => {
    setInvitingUsers(prev => ({ ...prev, [userId]: true }));
    
    try {
      const response = await fetch("/api/groups/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupId,
          invitedUserId: userId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send invite");
      }
      
      toast({
        title: "Invite sent",
        description: `${userName} has been invited to join ${groupName}`,
        variant: "default",
      });
      
      // Remove the invited user from results
      setSearchResults(prev => prev.filter(user => user.id !== userId));
      
      // Invalidate group queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    } catch (error: any) {
      console.error("Invite error:", error);
      toast({
        title: "Invitation failed",
        description: error.message || "Could not send invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setInvitingUsers(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Members
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite members to {groupName}</DialogTitle>
          <DialogDescription>
            Search for users to invite to your group.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-2 my-4">
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button 
            onClick={handleSearch} 
            disabled={isSearching || !searchTerm.trim()}
            variant="secondary"
            className="px-3"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
        
        {isSearching && (
          <div className="py-6 text-center text-muted-foreground">
            Searching...
          </div>
        )}
        
        {!isSearching && searchResults.length === 0 && searchTerm && (
          <div className="py-6 text-center text-muted-foreground">
            No users found matching "{searchTerm}"
          </div>
        )}
        
        {!isSearching && searchResults.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {searchResults.map((user) => (
              <div 
                key={user.id} 
                className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    {user.image && <img src={user.image} alt={user.name || "User"} />}
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.name}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleInviteUser(user.id, user.name || "User")}
                  disabled={invitingUsers[user.id]}
                  className="px-2"
                >
                  {invitingUsers[user.id] ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex justify-end gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 