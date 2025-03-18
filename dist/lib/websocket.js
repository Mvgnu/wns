"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketHandler = void 0;
exports.setupWebSocketKeepAlive = setupWebSocketKeepAlive;
class WebSocketHandler {
    // Upgrade an HTTP request to a WebSocket connection
    static upgrade(req) {
        const { socket, response } = Reflect.get(Object.getPrototypeOf(req), 'socket')(req);
        return { socket, response };
    }
    // Create a WebSocket pair (for testing purposes)
    static createSocketPair() {
        throw new Error('This method should only be used in a browser environment');
    }
}
exports.WebSocketHandler = WebSocketHandler;
// Helper function to keep WebSocket connections alive
function setupWebSocketKeepAlive(socket, interval = 30000) {
    const pingInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping' }));
        }
        else {
            clearInterval(pingInterval);
        }
    }, interval);
    // Return cleanup function
    return () => clearInterval(pingInterval);
}
