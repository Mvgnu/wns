import { NextRequest, NextResponse } from "next/server";
import { getSafeServerSession } from "@/lib/sessionHelper";
import {
  assertGroupAccessBySlug,
  createGroupThread,
  GroupChatError,
  listGroupThreads,
} from "@/lib/chat/service";

// feature: group-chat
// intent: surface asynchronous thread workflows for group communities.

type RouteParams = { params: { slug: string } };

export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = await getSafeServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") ?? "20");
    const group = await assertGroupAccessBySlug(params.slug, session.user.id);
    const threads = await listGroupThreads(group.id, session.user.id, limit);
    return NextResponse.json({ threads });
  } catch (error) {
    if (error instanceof GroupChatError) {
      const status = error.code === "GROUP_NOT_FOUND" ? 404 : 403;
      return NextResponse.json({ error: error.message }, { status });
    }

    console.error("threads list failed", error);
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
    const { title, content, conversationId, announce } = payload ?? {};

    if (typeof title !== "string" || typeof content !== "string") {
      return NextResponse.json({ error: "title and content required" }, { status: 400 });
    }

    const group = await assertGroupAccessBySlug(params.slug, session.user.id);
    const thread = await createGroupThread({
      groupId: group.id,
      createdById: session.user.id,
      title,
      content,
      conversationId,
      announce,
    });

    return NextResponse.json({ thread });
  } catch (error) {
    if (error instanceof GroupChatError) {
      const status =
        error.code === "MESSAGE_EMPTY" ? 400 : error.code === "GROUP_NOT_FOUND" ? 404 : 403;
      return NextResponse.json({ error: error.message }, { status });
    }

    console.error("thread create failed", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
