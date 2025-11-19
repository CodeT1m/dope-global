import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Track upload
export const trackUpload = mutation({
  args: {
    photographerId: v.string(),
    eventId: v.string(),
    photoCount: v.number(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("uploads", {
      photographerId: args.photographerId,
      eventId: args.eventId,
      photoCount: args.photoCount,
      status: args.status,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Get upload history
export const getUploadHistory = query({
  args: {
    photographerId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const uploads = await ctx.db
      .query("uploads")
      .withIndex("by_photographer", (q) => q.eq("photographerId", args.photographerId))
      .order("desc")
      .take(args.limit ?? 50);

    return uploads;
  },
});

// Update upload status
export const updateUploadStatus = mutation({
  args: {
    uploadId: v.id("uploads"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.uploadId, { status: args.status });
    return { success: true };
  },
});
