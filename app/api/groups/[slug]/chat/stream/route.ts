import { NextRequest } from "next/server";
import { getSafeServerSession } from "@/lib/sessionHelper";
import {
  assertGroupAccessBySlug,
  GroupChatError,
} from "@/lib/chat/service";
import { subscribeToGroup } from "@/lib/realtime/eventBus";

// feature: group-chat
// intent: expose a server-sent events feed for live group chat updates.

const encoder = new TextEncoder();

type RouteParams = { params: { slug: string } };

function formatSse(event: { event: string; data: unknown }) {
  return `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getSafeServerSession();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const group = await assertGroupAccessBySlug(params.slug, session.user.id);

    let unsubscribe: (() => void) | undefined;
    let heartbeat: NodeJS.Timeout | undefined;

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const send = (event: { event: string; data: unknown }) => {
          controller.enqueue(encoder.encode(formatSse(event)));
        };

        send({ event: "connected", data: { timestamp: new Date().toISOString() } });

        unsubscribe = subscribeToGroup(group.id, (payload) => {
          send({ event: payload.type, data: payload });
        });

        heartbeat = setInterval(() => {
          send({ event: "heartbeat", data: { timestamp: new Date().toISOString() } });
        }, 30000);
      },
      cancel() {
        unsubscribe?.();
        if (heartbeat) {
          clearInterval(heartbeat);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    if (error instanceof GroupChatError) {
      const status = error.code === "GROUP_NOT_FOUND" ? 404 : 403;
      return new Response(error.message, { status });
    }

    console.error("chat stream error", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
