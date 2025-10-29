import { NextRequest, NextResponse } from "next/server";
import { getSafeServerSession } from "@/lib/sessionHelper";
import {
  assertGroupAccessBySlug,
  GroupChatError,
  replyToGroupThread,
} from "@/lib/chat/service";

// feature: group-chat
// intent: allow members to append replies to existing asynchronous threads.

type RouteParams = { params: { slug: string; threadId: string } };

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await getSafeServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await req.json();
    const { body } = payload ?? {};

    if (typeof body !== "string") {
      return NextResponse.json({ error: "body is required" }, { status: 400 });
    }

    await assertGroupAccessBySlug(params.slug, session.user.id);
    const reply = await replyToGroupThread({
      threadId: params.threadId,
      authorId: session.user.id,
      body,
    });

    return NextResponse.json({ reply });
  } catch (error) {
    if (error instanceof GroupChatError) {
      const status =
        error.code === "THREAD_NOT_FOUND"
          ? 404
          : error.code === "MESSAGE_EMPTY"
          ? 400
          : error.code === "THREAD_LOCKED"
          ? 409
          : 403;
      return NextResponse.json({ error: error.message }, { status });
    }

    console.error("thread reply failed", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
