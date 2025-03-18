"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle, Play, Calendar, Clock } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function CronManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading48h, setLoading48h] = useState(false);
  const [loading24h, setLoading24h] = useState(false);

  // Redirect if not admin
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Check if user is authorized
  const isAdmin = session?.user && (session.user as any)?.role === "ADMIN";
  if (status === "unauthenticated" || !isAdmin) {
    return (
      <div className="container mx-auto py-8 max-w-3xl">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Unauthorized Access</AlertTitle>
          <AlertDescription>
            You do not have permission to view this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const runCronJob = async (jobType: '48_HOUR_REMINDER' | '24_HOUR_REMINDER') => {
    const loadingState = jobType === '48_HOUR_REMINDER' ? setLoading48h : setLoading24h;
    loadingState(true);

    try {
      const response = await fetch('/api/cron/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to run cron job');
      }

      toast({
        title: "Success",
        description: data.message,
        variant: "default",
      });
    } catch (error) {
      console.error('Error running cron job:', error);
      toast({
        title: "Error",
        description: "Failed to run cron job",
        variant: "destructive",
      });
    } finally {
      loadingState(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Cron Job Management</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Event Reminder Jobs</CardTitle>
          <CardDescription>
            Automatic reminder jobs that run daily to send notifications to users about upcoming events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="text-sm caption-bottom">
              <div className="border-b">
                <div className="grid grid-cols-4 border-b">
                  <div className="p-4 font-medium">Job</div>
                  <div className="p-4 font-medium">Description</div>
                  <div className="p-4 font-medium">Schedule</div>
                  <div className="p-4 font-medium">Action</div>
                </div>
              </div>
              <div>
                <div className="grid grid-cols-4 border-b">
                  <div className="p-4 font-medium">48-Hour Event Reminder</div>
                  <div className="p-4">Sends notifications to users about events occurring in 48 hours</div>
                  <div className="p-4 flex items-center gap-1">
                    <Clock className="h-4 w-4" /> 
                    <span>Daily at 9:00 AM</span>
                  </div>
                  <div className="p-4">
                    <Button 
                      size="sm" 
                      onClick={() => runCronJob('48_HOUR_REMINDER')}
                      disabled={loading48h}
                    >
                      {loading48h ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Run Now
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-4">
                  <div className="p-4 font-medium">24-Hour Event Reminder</div>
                  <div className="p-4">Sends notifications to users about events occurring in 24 hours</div>
                  <div className="p-4 flex items-center gap-1">
                    <Clock className="h-4 w-4" /> 
                    <span>Daily at 10:00 AM</span>
                  </div>
                  <div className="p-4">
                    <Button 
                      size="sm"
                      onClick={() => runCronJob('24_HOUR_REMINDER')}
                      disabled={loading24h}
                    >
                      {loading24h ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Run Now
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-4 text-center text-sm text-muted-foreground">
                List of scheduled event reminder jobs
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Jobs run automatically according to schedule. Manual execution is also available.</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 