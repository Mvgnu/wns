"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { setupWebSocketKeepAlive } from "@/lib/websocket";

export function useNotificationsWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    let cleanup: (() => void) | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    // Connect to WebSocket 
    const connect = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/notifications/ws`;
      
      const ws = new WebSocket(wsUrl);
      setSocket(ws);

      ws.addEventListener("open", () => {
        console.log("WebSocket connected");
        setConnected(true);
        
        // Set up ping/pong to keep connection alive
        cleanup = setupWebSocketKeepAlive(ws);
      });

      ws.addEventListener("message", (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle different message types
          if (data.type === "notification") {
            // New notification received
            const notification = data.data;
            
            // Invalidate query cache to refetch notifications
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            
            // Show toast notification
            toast({
              title: "New Notification",
              description: notification.message,
              variant: "default"
            });
          } else if (data.type === "pong") {
            // Pong response (keep-alive)
            console.log("WebSocket connection is alive");
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      });

      ws.addEventListener("close", (event) => {
        console.log(`WebSocket disconnected: ${event.code} ${event.reason}`);
        setConnected(false);
        cleanup && cleanup();
        
        // Reconnect after delay unless closed cleanly
        if (event.code !== 1000) {
          reconnectTimeout = setTimeout(connect, 5000);
        }
      });

      ws.addEventListener("error", (error) => {
        console.error("WebSocket error:", error);
        ws.close();
      });
    };

    // Connect when component mounts
    connect();

    // Clean up on unmount
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close(1000, "Component unmounted");
      }
      cleanup && cleanup();
      clearTimeout(reconnectTimeout);
    };
  }, [queryClient, toast]);

  return { connected };
} 