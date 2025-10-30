"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

// feature: group-chat
// intent: render the live group chat surface with conversation switching and thread tools.

type ConversationSummary = {
  id: string;
  slug: string;
  title: string | null;
  description: string | null;
  isDefault: boolean;
  messageCount: number;
  participantCount: number;
};

type MessageAuthor = {
  id: string;
  name: string | null;
  image: string | null;
};

type ChatMessage = {
  id: string;
  conversationId: string;
  body: string;
  createdAt: string;
  messageType: string;
  author: MessageAuthor;
};

type ThreadSummary = {
  id: string;
  title: string;
  content: string;
  status: string;
  moderationState: string;
  replyCount: number;
  lastActivityAt: string;
  createdBy: MessageAuthor;
};

type GroupChatPanelProps = {
  groupSlug: string;
  userId: string;
  initialConversations: ConversationSummary[];
  initialThreads: ThreadSummary[];
  isModerator: boolean;
};

type ChatEvent = {
  event: string;
  data: {
    conversationId?: string;
    threadId?: string;
    messageId?: string;
    payload?: any;
  };
};

export function GroupChatPanel(props: GroupChatPanelProps) {
  const { groupSlug, userId, initialConversations, initialThreads, isModerator } = props;
  const [conversations, setConversations] = useState<ConversationSummary[]>(initialConversations);
  const [threads, setThreads] = useState<ThreadSummary[]>(initialThreads);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    initialConversations.find((conversation) => conversation.isDefault)?.id || initialConversations[0]?.id || null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [threadTitle, setThreadTitle] = useState("");
  const [threadBody, setThreadBody] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [creatingThread, setCreatingThread] = useState(false);
  const [connectionState, setConnectionState] = useState<"connecting" | "online" | "offline">("connecting");
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const selectedConversationIdRef = useRef<string | null>(selectedConversationId);
  const { toast } = useToast();

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) || null,
    [conversations, selectedConversationId],
  );

  const fetchConversations = useCallback(async () => {
    const response = await fetch(`/api/groups/${groupSlug}/chat/conversations`);
    if (!response.ok) return;
    const data = await response.json();
    setConversations(data.conversations);
    if (!selectedConversationId && data.conversations.length > 0) {
      setSelectedConversationId(data.conversations[0].id);
    }
  }, [groupSlug, selectedConversationId]);

  const fetchThreads = useCallback(async () => {
    const response = await fetch(`/api/groups/${groupSlug}/chat/threads`);
    if (!response.ok) return;
    const data = await response.json();
    setThreads(data.threads);
  }, [groupSlug]);

  const fetchMessages = useCallback(async () => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    try {
      const response = await fetch(
        `/api/groups/${groupSlug}/chat/messages?conversationId=${selectedConversationId}&limit=100`,
      );
      if (!response.ok) return;
      const data = await response.json();
      const ordered = Array.isArray(data.messages)
        ? (data.messages as ChatMessage[])
            .map((message) => ({
              ...message,
              createdAt: message.createdAt ?? new Date().toISOString(),
            }))
            .reverse()
        : [];
      setMessages(ordered);
    } finally {
      setLoadingMessages(false);
    }
  }, [groupSlug, selectedConversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const establishEventStream = useCallback(() => {
    if (!groupSlug) {
      return;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const eventSource = new EventSource(`/api/groups/${groupSlug}/chat/stream`);
    eventSourceRef.current = eventSource;
    setConnectionState("connecting");

    const handleEvent = (event: MessageEvent) => {
      try {
        const payload: ChatEvent["data"] = JSON.parse(event.data);
        const type = (event as MessageEvent).type;

        if (
          type === "message:created" &&
          payload.conversationId === selectedConversationIdRef.current &&
          payload.payload?.message
        ) {
          setMessages((current) => {
            const exists = current.some((message) => message.id === payload.payload.message.id);
            if (exists) {
              return current;
            }
            return [...current, payload.payload.message];
          });
        }

        if (type === "thread:created" || type === "thread:moderated" || type === "thread:replied") {
          fetchThreads();
        }

        if (type === "conversation:created") {
          fetchConversations();
        }
      } catch (error) {
        console.error("chat event parse failed", error);
      }
    };

    eventSource.addEventListener("message:created", handleEvent);
    eventSource.addEventListener("thread:created", handleEvent);
    eventSource.addEventListener("thread:moderated", handleEvent);
    eventSource.addEventListener("conversation:created", handleEvent);

    eventSource.onopen = () => {
      setConnectionState("online");
      reconnectAttemptRef.current = 0;
    };

    eventSource.onerror = () => {
      setConnectionState("offline");
      eventSource.close();

      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }

      reconnectAttemptRef.current = Math.min(reconnectAttemptRef.current + 1, 5);
      const delay = Math.min(30000, 1000 * 2 ** reconnectAttemptRef.current);
      reconnectTimeoutRef.current = window.setTimeout(() => {
        establishEventStream();
        fetchConversations();
        fetchThreads();
      }, delay);
    };

    return () => {
      eventSource.removeEventListener("message:created", handleEvent);
      eventSource.removeEventListener("thread:created", handleEvent);
      eventSource.removeEventListener("thread:moderated", handleEvent);
      eventSource.removeEventListener("conversation:created", handleEvent);
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [fetchConversations, fetchThreads, groupSlug]);

  useEffect(() => {
    establishEventStream();

    return () => {
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [establishEventStream]);

  const handleSendMessage = useCallback(async () => {
    if (!selectedConversationId || messageInput.trim().length === 0) {
      return;
    }

    setSendingMessage(true);
    try {
      const response = await fetch(`/api/groups/${groupSlug}/chat/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: selectedConversationId,
          body: messageInput,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        toast({
          title: "Nachricht konnte nicht gesendet werden",
          description: error?.error ?? "Bitte versuche es in Kürze erneut.",
          variant: "destructive",
        });
        return;
      }

      setMessageInput("");
      const data = await response.json();
      if (data.message) {
        setMessages((current) => [...current, data.message]);
      }
    } catch (error) {
      toast({
        title: "Verbindung unterbrochen",
        description: "Deine Nachricht wurde nicht gesendet. Prüfe deine Verbindung und versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  }, [groupSlug, messageInput, selectedConversationId, toast]);

  const handleCreateThread = useCallback(async () => {
    if (threadTitle.trim().length === 0 || threadBody.trim().length === 0) {
      return;
    }

    setCreatingThread(true);
    try {
      const response = await fetch(`/api/groups/${groupSlug}/chat/threads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: threadTitle,
          content: threadBody,
          conversationId: selectedConversationId,
          announce: true,
        }),
      });

      if (response.ok) {
        setThreadTitle("");
        setThreadBody("");
        fetchThreads();
      }
    } finally {
      setCreatingThread(false);
    }
  }, [fetchThreads, groupSlug, selectedConversationId, threadBody, threadTitle]);

  const handleFlagThread = useCallback(
    async (threadId: string) => {
      await fetch(`/api/groups/${groupSlug}/chat/threads/${threadId}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "member_flag" }),
      });
      fetchThreads();
    },
    [fetchThreads, groupSlug],
  );

  const handleModerateThread = useCallback(
    async (threadId: string, state: string) => {
      await fetch(`/api/groups/${groupSlug}/chat/threads/${threadId}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      });
      fetchThreads();
    },
    [fetchThreads, groupSlug],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      {connectionState !== "online" && (
        <Alert variant="destructive" className="lg:col-span-2">
          <AlertTitle>
            {connectionState === "offline" ? "Verbindung getrennt" : "Verbindung wird aufgebaut"}
          </AlertTitle>
          <AlertDescription>
            {connectionState === "offline"
              ? "Wir versuchen automatisch, die Chat-Verbindung wiederherzustellen."
              : "Der Chat stellt gerade eine Verbindung zum Server her."}
          </AlertDescription>
        </Alert>
      )}
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Gruppenchat</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[520px] flex-col gap-4">
          <Tabs
            value={selectedConversation?.id ?? ""}
            onValueChange={(value) => setSelectedConversationId(value)}
            className="flex flex-1 flex-col"
          >
            <TabsList className="flex flex-wrap justify-start gap-2 overflow-x-auto">
              {conversations.map((conversation) => (
                <TabsTrigger key={conversation.id} value={conversation.id} className="capitalize">
                  {conversation.title || conversation.slug}
                  {conversation.isDefault && <Badge className="ml-2" variant="secondary">Standard</Badge>}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value={selectedConversation?.id ?? ""} className="flex flex-1 flex-col">
              <ScrollArea className="h-full rounded border bg-muted/30 p-4">
                {loadingMessages && <p className="text-sm text-muted-foreground">Nachrichten werden geladen…</p>}
                {!loadingMessages && messages.length === 0 && (
                  <p className="text-sm text-muted-foreground">Noch keine Nachrichten – starte die Unterhaltung!</p>
                )}
                <div className="flex flex-col gap-4">
                  {messages.map((message) => (
                    <div key={message.id} className="flex gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={message.author?.image ?? undefined} alt={message.author?.name ?? ""} />
                        <AvatarFallback>{message.author?.name?.[0] ?? "?"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{message.author?.name ?? "Mitglied"}</span>
                          {message.author?.id === userId && (
                            <Badge variant="outline" className="text-xs">
                              Du
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                          </span>
                          {message.messageType === "system" && (
                            <Badge variant="outline" className="text-xs">
                              System
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed">{message.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="mt-4 flex flex-col gap-2">
                <Textarea
                  placeholder="Nachricht schreiben…"
                  value={messageInput}
                  onChange={(event) => setMessageInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && event.metaKey) {
                      event.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Drücke ⌘ + Enter zum Senden
                  </span>
                  <Button onClick={handleSendMessage} disabled={sendingMessage || messageInput.trim().length === 0}>
                    Nachricht senden
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Thread starten</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Input
              placeholder="Titel"
              value={threadTitle}
              onChange={(event) => setThreadTitle(event.target.value)}
            />
            <Textarea
              placeholder="Worum geht es in diesem Thread?"
              value={threadBody}
              onChange={(event) => setThreadBody(event.target.value)}
              rows={4}
            />
            <Button onClick={handleCreateThread} disabled={creatingThread}>
              Thread erstellen
            </Button>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Threads</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {threads.length === 0 && (
              <p className="text-sm text-muted-foreground">Noch keine Threads – starte einen neuen Dialog!</p>
            )}
            <div className="flex flex-col gap-4">
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  className={cn(
                    "rounded border p-3",
                    thread.moderationState === "flagged" && "border-destructive/50 bg-destructive/10",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-semibold">{thread.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {thread.replyCount} Antworten · Letzte Aktivität {formatDistanceToNow(new Date(thread.lastActivityAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs uppercase">
                      {thread.moderationState}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{thread.content}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      Erstellt von {thread.createdBy?.name ?? "Mitglied"}
                      {thread.createdBy?.id === userId ? " (Du)" : ""}
                    </span>
                    <span>· Status {thread.status}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleFlagThread(thread.id)}>
                      Melden
                    </Button>
                    {isModerator && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleModerateThread(thread.id, "reviewed")}
                        >
                          Als geprüft markieren
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleModerateThread(thread.id, "removed")}
                        >
                          Entfernen
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
