import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Update user presence
export const updatePresence = mutation({
  args: {
    userId: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        lastSeen: Date.now(),
      });
    } else {
      await ctx.db.insert("presence", {
        userId: args.userId,
        status: args.status,
        lastSeen: Date.now(),
      });
    }

    return { success: true };
  },
});

// Get user presence
export const getUserPresence = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const presence = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!presence) {
      return { status: "offline", lastSeen: 0 };
    }

    // Mark as offline if last seen more than 5 minutes ago
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    if (now - presence.lastSeen > fiveMinutes && presence.status !== "offline") {
      return { status: "offline", lastSeen: presence.lastSeen };
    }

    return presence;
  },
});

// Get multiple users presence
export const getMultiplePresence = query({
  args: {
    userIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const presences = await Promise.all(
      args.userIds.map(async (userId) => {
        const presence = await ctx.db
          .query("presence")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first();

        return {
          userId,
          status: presence?.status ?? "offline",
          lastSeen: presence?.lastSeen ?? 0,
        };
      })
    );

    return presences;
  },
});
