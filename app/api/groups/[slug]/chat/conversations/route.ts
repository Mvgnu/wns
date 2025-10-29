import { NextRequest, NextResponse } from "next/server";
import { GroupConversationType } from "@prisma/client";
import { getSafeServerSession } from "@/lib/sessionHelper";
import {
  assertGroupAccessBySlug,
  createGroupConversation,
  GroupChatError,
  listGroupConversations,
} from "@/lib/chat/service";

// feature: group-chat
// intent: list and create chat conversations for a specific group context.

type RouteParams = { params: { slug: string } };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getSafeServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const group = await assertGroupAccessBySlug(params.slug, session.user.id);
    const conversations = await listGroupConversations(group.id, session.user.id);
    return NextResponse.json({ conversations });
  } catch (error) {
    if (error instanceof GroupChatError) {
      const status = error.code === "GROUP_NOT_FOUND" ? 404 : 403;
      return NextResponse.json({ error: error.message }, { status });
    }

    console.error("conversation list failed", error);
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
    const { title, description, type } = payload ?? {};
    if (typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const group = await assertGroupAccessBySlug(params.slug, session.user.id);
    const conversation = await createGroupConversation({
      groupId: group.id,
      creatorId: session.user.id,
      title,
      description,
      type: type && Object.values(GroupConversationType).includes(type)
        ? type
        : GroupConversationType.topic,
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    if (error instanceof GroupChatError) {
      const status =
        error.code === "GROUP_NOT_FOUND"
          ? 404
          : error.code === "MESSAGE_EMPTY"
          ? 400
          : 403;
      return NextResponse.json({ error: error.message }, { status });
    }

    console.error("conversation create failed", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
