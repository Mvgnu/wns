import {
  GroupConversation,
  GroupConversationType,
  GroupMessage,
  GroupMessageType,
  GroupThread,
  GroupThreadMessage,
  GroupThreadStatus,
  ThreadModerationState,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { publishChatEvent } from "@/lib/realtime/eventBus";
import { slugify } from "@/lib/utils";

// feature: group-chat
// intent: provide conversation, message, and thread orchestration helpers for communities.

export type ConversationWithSummary = GroupConversation & {
  messageCount: number;
  participantCount: number;
};

export type GroupThreadWithCounts = GroupThread & {
  replyCount: number;
};

export class GroupChatError extends Error {
  code:
    | "GROUP_NOT_FOUND"
    | "NOT_MEMBER"
    | "CONVERSATION_NOT_FOUND"
    | "MESSAGE_TOO_LONG"
    | "MESSAGE_EMPTY"
    | "THREAD_NOT_FOUND"
    | "THREAD_LOCKED"
    | "NOT_AUTHORIZED";

  constructor(message: string, code: GroupChatError["code"]) {
    super(message);
    this.name = "GroupChatError";
    this.code = code;
  }
}

const MAX_MESSAGE_LENGTH = 4000;

async function assertGroupAccess(groupId: string, userId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      ownerId: true,
      admins: { select: { userId: true } },
      memberStatuses: {
        where: { userId, status: { in: ["active", "pending"] } },
        select: { status: true },
      },
    },
  });

  if (!group) {
    throw new GroupChatError("Group not found", "GROUP_NOT_FOUND");
  }

  const isOwner = group.ownerId === userId;
  const isAdmin = group.admins.some((admin) => admin.userId === userId);
  const isMember = group.memberStatuses.length > 0;

  if (!isOwner && !isAdmin && !isMember) {
    throw new GroupChatError("User must be a group member", "NOT_MEMBER");
  }

  return group;
}

async function ensureDefaultConversation(groupId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true, ownerId: true },
  });

  if (!group) {
    throw new GroupChatError("Group not found", "GROUP_NOT_FOUND");
  }

  return prisma.groupConversation.upsert({
    where: { groupId_slug: { groupId, slug: "general" } },
    update: {},
    create: {
      groupId,
      slug: "general",
      title: "General",
      description: "Live chat for the group community",
      isDefault: true,
      createdById: group.ownerId,
      type: GroupConversationType.general,
    },
  });
}

export async function findGroupBySlugOrId(identifier: string) {
  return prisma.group.findFirst({
    where: {
      OR: [{ slug: identifier }, { id: identifier }],
    },
    select: { id: true },
  });
}

export async function assertGroupAccessBySlug(slugOrId: string, userId: string) {
  const group = await findGroupBySlugOrId(slugOrId);
  if (!group) {
    throw new GroupChatError("Group not found", "GROUP_NOT_FOUND");
  }

  await assertGroupAccess(group.id, userId);
  return group;
}

export async function listGroupConversations(
  groupId: string,
  userId: string,
): Promise<ConversationWithSummary[]> {
  await assertGroupAccess(groupId, userId);
  await ensureDefaultConversation(groupId);

  const conversations = await prisma.groupConversation.findMany({
    where: { groupId },
    orderBy: [
      { isDefault: "desc" },
      { lastActivityAt: "desc" },
    ],
    include: {
      messages: {
        select: { authorId: true },
      },
    },
  });

  return conversations.map((conversation) => ({
    ...conversation,
    messageCount: conversation.messages.length,
    participantCount: new Set(conversation.messages.map((message) => message.authorId)).size,
  }));
}

export async function createGroupConversation(options: {
  groupId: string;
  creatorId: string;
  title: string;
  description?: string;
  type?: GroupConversationType;
}) {
  const { groupId, creatorId, title, description, type = GroupConversationType.topic } = options;
  const normalizedTitle = title.trim();

  if (!normalizedTitle) {
    throw new GroupChatError("Conversation title required", "MESSAGE_EMPTY");
  }

  await assertGroupAccess(groupId, creatorId);

  const baseSlug = slugify(normalizedTitle) || "channel";
  let slug = baseSlug;
  let suffix = 1;

  while (true) {
    const existing = await prisma.groupConversation.findFirst({
      where: { groupId, slug },
      select: { id: true },
    });

    if (!existing) {
      break;
    }

    slug = `${baseSlug}-${suffix++}`;
  }

  const conversation = await prisma.groupConversation.create({
    data: {
      groupId,
      createdById: creatorId,
      slug,
      title: normalizedTitle,
      description,
      type,
      isDefault: false,
    },
  });

  publishChatEvent({
    type: "conversation:created",
    groupId,
    conversationId: conversation.id,
    payload: {
      title: normalizedTitle,
      slug: conversation.slug,
      type,
    },
    timestamp: new Date().toISOString(),
  });

  return conversation;
}

export async function listConversationMessages(
  conversationId: string,
  userId: string,
  limit = 50,
): Promise<GroupMessage[]> {
  const conversation = await prisma.groupConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, groupId: true },
  });

  if (!conversation) {
    throw new GroupChatError("Conversation not found", "CONVERSATION_NOT_FOUND");
  }

  await assertGroupAccess(conversation.groupId, userId);

  return prisma.groupMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });
}

export async function postGroupMessage(options: {
  conversationId: string;
  authorId: string;
  body: string;
  messageType?: GroupMessageType;
}) {
  const { conversationId, authorId, body, messageType = GroupMessageType.text } = options;
  const sanitized = body.trim();

  if (!sanitized) {
    throw new GroupChatError("Message cannot be empty", "MESSAGE_EMPTY");
  }

  if (sanitized.length > MAX_MESSAGE_LENGTH) {
    throw new GroupChatError("Message exceeds length limits", "MESSAGE_TOO_LONG");
  }

  const conversation = await prisma.groupConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, groupId: true },
  });

  if (!conversation) {
    throw new GroupChatError("Conversation not found", "CONVERSATION_NOT_FOUND");
  }

  await assertGroupAccess(conversation.groupId, authorId);

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.groupMessage.create({
      data: {
        conversationId,
        authorId,
        body: sanitized,
        messageType,
      },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    await tx.groupConversation.update({
      where: { id: conversationId },
      data: { lastActivityAt: new Date() },
    });

    return created;
  });

  publishChatEvent({
    type: "message:created",
    groupId: conversation.groupId,
    conversationId,
    messageId: message.id,
    payload: { message },
    timestamp: new Date().toISOString(),
  });

  return message;
}

export async function createGroupThread(options: {
  groupId: string;
  createdById: string;
  title: string;
  content: string;
  conversationId?: string;
  announce?: boolean;
}): Promise<GroupThreadWithCounts> {
  const { groupId, createdById, title, content, conversationId, announce = true } = options;
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();

  if (!trimmedTitle) {
    throw new GroupChatError("Thread title is required", "MESSAGE_EMPTY");
  }

  if (!trimmedContent) {
    throw new GroupChatError("Thread body is required", "MESSAGE_EMPTY");
  }

  await assertGroupAccess(groupId, createdById);

  if (conversationId) {
    const conversation = await prisma.groupConversation.findFirst({
      where: { id: conversationId, groupId },
    });

    if (!conversation) {
      throw new GroupChatError("Conversation not found", "CONVERSATION_NOT_FOUND");
    }
  }

  const thread = await prisma.$transaction(async (tx) => {
    const createdThread = await tx.groupThread.create({
      data: {
        groupId,
        createdById,
        conversationId,
        title: trimmedTitle,
        content: trimmedContent,
        status: GroupThreadStatus.open,
      },
    });

    const firstReply = await tx.groupThreadMessage.create({
      data: {
        threadId: createdThread.id,
        authorId: createdById,
        body: trimmedContent,
      },
    });

    await tx.groupThread.update({
      where: { id: createdThread.id },
      data: {
        lastActivityAt: new Date(),
        metadata: { replies: 1 },
      },
    });

    if (announce && conversationId) {
      await tx.groupMessage.create({
        data: {
          conversationId,
          authorId: createdById,
          body: `Thread gestartet: ${trimmedTitle}`,
          messageType: GroupMessageType.system,
        },
      });
    }

    return { thread: createdThread, firstReply };
  });

  publishChatEvent({
    type: "thread:created",
    groupId,
    conversationId,
    threadId: thread.thread.id,
    payload: {
      title: trimmedTitle,
      content: trimmedContent,
    },
    timestamp: new Date().toISOString(),
  });

  return {
    ...thread.thread,
    replyCount: 1,
  };
}

export async function replyToGroupThread(options: {
  threadId: string;
  authorId: string;
  body: string;
}): Promise<GroupThreadMessage> {
  const { threadId, authorId } = options;
  const body = options.body.trim();

  if (!body) {
    throw new GroupChatError("Reply cannot be empty", "MESSAGE_EMPTY");
  }

  const thread = await prisma.groupThread.findUnique({
    where: { id: threadId },
    select: { id: true, groupId: true, status: true },
  });

  if (!thread) {
    throw new GroupChatError("Thread not found", "THREAD_NOT_FOUND");
  }

  if (thread.status === GroupThreadStatus.locked) {
    throw new GroupChatError("Thread is locked", "THREAD_LOCKED");
  }

  await assertGroupAccess(thread.groupId, authorId);

  const reply = await prisma.$transaction(async (tx) => {
    const created = await tx.groupThreadMessage.create({
      data: {
        threadId,
        authorId,
        body,
      },
    });

    await tx.groupThread.update({
      where: { id: threadId },
      data: { lastActivityAt: new Date() },
    });

    return created;
  });

  publishChatEvent({
    type: "thread:replied",
    groupId: thread.groupId,
    threadId,
    payload: { replyId: reply.id },
    timestamp: new Date().toISOString(),
  });

  return reply;
}

export async function listGroupThreads(
  groupId: string,
  userId: string,
  limit = 20,
): Promise<GroupThreadWithCounts[]> {
  await assertGroupAccess(groupId, userId);

  const threads = await prisma.groupThread.findMany({
    where: { groupId },
    orderBy: { lastActivityAt: "desc" },
    take: limit,
    include: {
      messages: {
        select: { id: true },
      },
      createdBy: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  return threads.map((thread) => ({
    ...thread,
    replyCount: thread.messages.length,
  }));
}

export async function moderateGroupThread(options: {
  threadId: string;
  moderatorId: string;
  state: ThreadModerationState;
  note?: string;
}) {
  const { threadId, moderatorId, state, note } = options;
  const thread = await prisma.groupThread.findUnique({
    where: { id: threadId },
    select: { id: true, groupId: true },
  });

  if (!thread) {
    throw new GroupChatError("Thread not found", "THREAD_NOT_FOUND");
  }

  const group = await assertGroupAccess(thread.groupId, moderatorId);
  const isPrivileged =
    group.ownerId === moderatorId ||
    group.admins?.some((admin) => admin.userId === moderatorId);

  if (!isPrivileged) {
    throw new GroupChatError("Moderator privileges required", "NOT_AUTHORIZED");
  }

  const updated = await prisma.groupThread.update({
    where: { id: threadId },
    data: {
      moderationState: state,
      moderatorId,
      metadata: {
        ...(note ? { note } : {}),
      },
    },
  });

  publishChatEvent({
    type: "thread:moderated",
    groupId: thread.groupId,
    threadId,
    payload: { moderationState: state },
    timestamp: new Date().toISOString(),
  });

  return updated;
}

export async function flagGroupThread(options: {
  threadId: string;
  userId: string;
  reason?: string;
}) {
  const { threadId, userId, reason } = options;
  const thread = await prisma.groupThread.findUnique({
    where: { id: threadId },
    select: { id: true, groupId: true },
  });

  if (!thread) {
    throw new GroupChatError("Thread not found", "THREAD_NOT_FOUND");
  }

  await assertGroupAccess(thread.groupId, userId);

  const updated = await prisma.groupThread.update({
    where: { id: threadId },
    data: {
      moderationState: ThreadModerationState.flagged,
      metadata: {
        flaggedBy: userId,
        ...(reason ? { reason } : {}),
      },
    },
  });

  publishChatEvent({
    type: "thread:moderated",
    groupId: thread.groupId,
    threadId,
    payload: { moderationState: ThreadModerationState.flagged },
    timestamp: new Date().toISOString(),
  });

  return updated;
}
