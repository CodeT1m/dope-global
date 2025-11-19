import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Send a message
export const sendMessage = mutation({
  args: {
    senderId: v.string(),
    receiverId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const conversationId = [args.senderId, args.receiverId].sort().join("-");

    await ctx.db.insert("messages", {
      senderId: args.senderId,
      receiverId: args.receiverId,
      content: args.content,
      conversationId,
      read: false,
      createdAt: Date.now(),
    });

    // Notify receiver
    await ctx.db.insert("notifications", {
      userId: args.receiverId,
      type: "message",
      title: "New Message",
      message: args.content.substring(0, 50),
      metadata: { senderId: args.senderId },
      read: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Get conversation messages
export const getConversation = query({
  args: {
    userId1: v.string(),
    userId2: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const conversationId = [args.userId1, args.userId2].sort().join("-");

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .order("desc")
      .take(args.limit ?? 100);

    return messages.reverse();
  },
});

// Mark messages as read
export const markMessagesAsRead = mutation({
  args: {
    conversationId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) =>
        q.and(
          q.eq(q.field("receiverId"), args.userId),
          q.eq(q.field("read"), false)
        )
      )
      .collect();

    await Promise.all(messages.map((m) => ctx.db.patch(m._id, { read: true })));

    return { success: true, count: messages.length };
  },
});

// Get unread message count
export const getUnreadMessageCount = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("messages")
      .withIndex("by_receiver", (q) =>
        q.eq("receiverId", args.userId).eq("read", false)
      )
      .collect();

    return unread.length;
  },
});
