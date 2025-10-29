import { NextRequest, NextResponse } from "next/server";
import { ThreadModerationState } from "@prisma/client";
import { getSafeServerSession } from "@/lib/sessionHelper";
import {
  assertGroupAccessBySlug,
  GroupChatError,
  moderateGroupThread,
} from "@/lib/chat/service";

// feature: group-chat
// intent: provide privileged moderators with thread state controls.

type RouteParams = { params: { slug: string; threadId: string } };

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await getSafeServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await req.json();
    const { state, note } = payload ?? {};

    if (!state || !Object.values(ThreadModerationState).includes(state)) {
      return NextResponse.json({ error: "valid state required" }, { status: 400 });
    }

    await assertGroupAccessBySlug(params.slug, session.user.id);
    const thread = await moderateGroupThread({
      threadId: params.threadId,
      moderatorId: session.user.id,
      state,
      note,
    });

    return NextResponse.json({ thread });
  } catch (error) {
    if (error instanceof GroupChatError) {
      const status =
        error.code === "THREAD_NOT_FOUND"
          ? 404
          : error.code === "NOT_AUTHORIZED"
          ? 403
          : 400;
      return NextResponse.json({ error: error.message }, { status });
    }

    console.error("thread moderate failed", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
