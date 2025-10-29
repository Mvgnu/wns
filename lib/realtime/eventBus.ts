import { EventEmitter } from "events";

// feature: group-chat
// intent: provide an in-memory pub/sub bridge powering server-sent chat updates.

export type ChatRealtimeEvent = {
  type:
    | "conversation:created"
    | "message:created"
    | "thread:created"
    | "thread:replied"
    | "thread:moderated";
  groupId: string;
  conversationId?: string;
  threadId?: string;
  messageId?: string;
  payload?: Record<string, unknown>;
  timestamp: string;
};

const emitter = new EventEmitter();
emitter.setMaxListeners(0);

export function publishChatEvent(event: ChatRealtimeEvent) {
  emitter.emit(event.groupId, event);
  if (event.conversationId) {
    emitter.emit(`${event.groupId}:${event.conversationId}`, event);
  }
  if (event.threadId) {
    emitter.emit(`${event.groupId}:thread:${event.threadId}`, event);
  }
}

export function subscribeToGroup(
  groupId: string,
  onEvent: (event: ChatRealtimeEvent) => void,
) {
  const handler = (event: ChatRealtimeEvent) => onEvent(event);
  emitter.on(groupId, handler);
  return () => {
    emitter.off(groupId, handler);
  };
}

export function subscribeToConversation(
  groupId: string,
  conversationId: string,
  onEvent: (event: ChatRealtimeEvent) => void,
) {
  const channel = `${groupId}:${conversationId}`;
  const handler = (event: ChatRealtimeEvent) => onEvent(event);
  emitter.on(channel, handler);
  return () => emitter.off(channel, handler);
}

export function subscribeToThread(
  groupId: string,
  threadId: string,
  onEvent: (event: ChatRealtimeEvent) => void,
) {
  const channel = `${groupId}:thread:${threadId}`;
  const handler = (event: ChatRealtimeEvent) => onEvent(event);
  emitter.on(channel, handler);
  return () => emitter.off(channel, handler);
}
