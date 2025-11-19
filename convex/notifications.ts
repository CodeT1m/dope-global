import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create face match notification
export const notifyFaceMatch = mutation({
  args: {
    userId: v.string(),
    photoId: v.string(),
    eventId: v.string(),
    confidence: v.number(),
  },
  handler: async (ctx, args) => {
    // Store face match result
    await ctx.db.insert("faceMatches", {
      userId: args.userId,
      photoId: args.photoId,
      eventId: args.eventId,
      confidence: args.confidence,
      createdAt: Date.now(),
    });

    // Send notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "face_match",
      title: "Photo Match Found!",
      message: `We found you in a new photo with ${Math.round(args.confidence * 100)}% confidence`,
      metadata: {
        photoId: args.photoId,
        eventId: args.eventId,
      },
      read: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Get user notifications
export const getUserNotifications = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit ?? 50);

    return notifications;
  },
});

// Mark notification as read
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { read: true });
    return { success: true };
  },
});

// Mark all notifications as read
export const markAllAsRead = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("read"), false))
      .collect();

    await Promise.all(
      notifications.map((n) => ctx.db.patch(n._id, { read: true }))
    );

    return { success: true, count: notifications.length };
  },
});

// Get unread count
export const getUnreadCount = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("read"), false))
      .collect();

    return unread.length;
  },
});
