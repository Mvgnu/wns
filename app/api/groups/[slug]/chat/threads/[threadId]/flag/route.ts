import { NextRequest, NextResponse } from "next/server";
import { getSafeServerSession } from "@/lib/sessionHelper";
import {
  assertGroupAccessBySlug,
  flagGroupThread,
  GroupChatError,
} from "@/lib/chat/service";

// feature: group-chat
// intent: allow members to flag threads for moderator review.

type RouteParams = { params: { slug: string; threadId: string } };

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await getSafeServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await req.json().catch(() => ({}));
    const { reason } = payload ?? {};

    await assertGroupAccessBySlug(params.slug, session.user.id);
    const thread = await flagGroupThread({
      threadId: params.threadId,
      userId: session.user.id,
      reason,
    });

    return NextResponse.json({ thread });
  } catch (error) {
    if (error instanceof GroupChatError) {
      const status = error.code === "THREAD_NOT_FOUND" ? 404 : 403;
      return NextResponse.json({ error: error.message }, { status });
    }

    console.error("thread flag failed", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
