import { NextRequest } from 'next/server';

// Define WebSocket types to use in our application
interface WebSocketConnection {
  socket: WebSocket;
  response: Response;
}

export class WebSocketHandler {
  // Upgrade an HTTP request to a WebSocket connection
  static upgrade(req: NextRequest): WebSocketConnection {
    const { socket, response } = Reflect.get(
      Object.getPrototypeOf(req),
      'socket'
    )(req);

    return { socket, response };
  }

  // Create a WebSocket pair (for testing purposes)
  static createSocketPair(): [WebSocket, WebSocket] {
    throw new Error('This method should only be used in a browser environment');
  }
}

// Helper function to keep WebSocket connections alive
export function setupWebSocketKeepAlive(
  socket: WebSocket, 
  interval: number = 30000
): () => void {
  const pingInterval = setInterval(() => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'ping' }));
    } else {
      clearInterval(pingInterval);
    }
  }, interval);

  // Return cleanup function
  return () => clearInterval(pingInterval);
} 