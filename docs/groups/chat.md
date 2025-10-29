# Group chat and threads

The group chat module introduces live conversations and asynchronous topic threads for
community spaces. API handlers under `/api/groups/[slug]/chat` expose conversation,
message, and thread endpoints, while the `GroupChatPanel` client component wires the
experience into the group detail page with server-sent events for realtime updates.
