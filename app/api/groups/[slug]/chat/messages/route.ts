import { NextRequest, NextResponse } from "next/server";
import { GroupMessageType } from "@prisma/client";
import { getSafeServerSession } from "@/lib/sessionHelper";
import {
  assertGroupAccessBySlug,
  GroupChatError,
  listConversationMessages,
  postGroupMessage,
} from "@/lib/chat/service";

// feature: group-chat
// intent: expose CRUD endpoints for live chat messages within a group conversation.

type RouteParams = { params: { slug: string } };

export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = await getSafeServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    const limit = Number(searchParams.get("limit") ?? "50");

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
    }

    const group = await assertGroupAccessBySlug(params.slug, session.user.id);
    const messages = await listConversationMessages(conversationId, session.user.id, limit);
    return NextResponse.json({ messages, groupId: group.id });
  } catch (error) {
    if (error instanceof GroupChatError) {
      const status =
        error.code === "CONVERSATION_NOT_FOUND"
          ? 404
          : error.code === "GROUP_NOT_FOUND"
          ? 404
          : error.code === "NOT_MEMBER"
          ? 403
          : 400;
      return NextResponse.json({ error: error.message }, { status });
    }

    console.error("messages fetch failed", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await getSafeServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await req.json();
    const { conversationId, body, messageType } = payload ?? {};

    if (typeof conversationId !== "string" || typeof body !== "string") {
      return NextResponse.json({ error: "conversationId and body required" }, { status: 400 });
    }

    await assertGroupAccessBySlug(params.slug, session.user.id);
    const message = await postGroupMessage({
      conversationId,
      authorId: session.user.id,
      body,
      messageType:
        messageType && Object.values(GroupMessageType).includes(messageType)
          ? messageType
          : GroupMessageType.text,
    });

    return NextResponse.json({ message });
  } catch (error) {
    if (error instanceof GroupChatError) {
      const status =
        error.code === "MESSAGE_TOO_LONG" || error.code === "MESSAGE_EMPTY" ? 400 : 403;
      return NextResponse.json({ error: error.message }, { status });
    }

    console.error("message create failed", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
