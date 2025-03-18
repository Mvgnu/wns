"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Trash2, Bell, CheckCheck } from "lucide-react";
import NotificationItem from "@/components/NotificationItem";

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    limit: 10,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/notifications");
    } else if (status === "authenticated") {
      fetchNotifications();
    }
  }, [status, activeTab, pagination.page, router]);

  const handleMarkAllAsRead = () => {
    // Implementation
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "PUT",
      });

      if (response.ok) {
        setNotifications(
          notifications.map((n) => 
            n.id === id ? { ...n, read: true } : n
          )
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleDelete = (id: string) => {
    // Implementation
  };

  const handleClearAll = () => {
    // Implementation
  };

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const filter = activeTab === "unread" ? "unread" : "all";
      const response = await fetch(`/api/notifications?filter=${filter}&page=${pagination.page}&limit=${pagination.limit}`);
      const data = await response.json();

      setNotifications(data.notifications);
      setPagination({
        page: data.pagination.page,
        pages: data.pagination.pages,
        limit: data.pagination.limit,
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getNotificationUrl = (notification: any) => {
    return notification.linkUrl || "/notifications";
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-8">Benachrichtigungen</h1>

      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <Button 
            onClick={handleMarkAllAsRead} 
            variant="outline" 
            size="sm"
            disabled={notifications.every(n => n.read)}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Alle als gelesen markieren
          </Button>
          <Button 
            onClick={handleClearAll} 
            variant="outline" 
            size="sm"
            disabled={notifications.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Alle löschen
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">Alle</TabsTrigger>
          <TabsTrigger value="unread">Ungelesen</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Alle Benachrichtigungen</CardTitle>
            </CardHeader>
            <CardContent>
              {renderNotificationsList()}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="unread">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Ungelesene Benachrichtigungen</CardTitle>
            </CardHeader>
            <CardContent>
              {renderNotificationsList()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          <Button
            variant="outline"
            onClick={() => setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })}
            disabled={pagination.page === 1}
          >
            Zurück
          </Button>
          <span className="py-2 px-4 text-sm">
            Seite {pagination.page} von {pagination.pages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPagination({ ...pagination, page: Math.min(pagination.pages, pagination.page + 1) })}
            disabled={pagination.page === pagination.pages}
          >
            Weiter
          </Button>
        </div>
      )}
    </div>
  );

  function renderNotificationsList() {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      );
    }

    if (notifications.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">Keine Benachrichtigungen gefunden</p>
        </div>
      );
    }

    return (
      <ul className="divide-y">
        {notifications.map((notification) => (
          <NotificationItem 
            key={notification.id}
            notification={notification}
            onMarkAsRead={handleMarkAsRead}
          />
        ))}
      </ul>
    );
  }
} 