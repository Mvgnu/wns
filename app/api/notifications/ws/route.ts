export const dynamic = "force-static";
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WebSocketHandler } from '@/lib/websocket';
import { addConnection, removeConnection } from '@/lib/notificationService';

// WebSocket handler for real-time notifications
export async function GET(req: NextRequest) {
  // Verify authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;
  const { socket, response } = WebSocketHandler.upgrade(req);

  // Add this connection to the user's set of connections
  addConnection(userId, socket);

  // Set up event handlers
  socket.addEventListener('close', () => {
    // Remove this connection when it closes
    removeConnection(userId, socket);
  });

  // Handle ping messages to keep connection alive
  socket.addEventListener('message', (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'ping') {
        socket.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  });

  return response;
} 