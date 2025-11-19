import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Follow a user
export const followUser = mutation({
  args: {
    followerId: v.string(),
    followingId: v.string(),
  },
  handler: async (ctx, args) => {
    const { followerId, followingId } = args;

    // Check if already following
    const existing = await ctx.db
      .query("follows")
      .withIndex("by_relationship", (q) =>
        q.eq("followerId", followerId).eq("followingId", followingId)
      )
      .first();

    if (existing) {
      return { success: false, message: "Already following" };
    }

    // Create follow relationship
    await ctx.db.insert("follows", {
      followerId,
      followingId,
      createdAt: Date.now(),
    });

    // Send notification to the followed user
    await ctx.db.insert("notifications", {
      userId: followingId,
      type: "new_follower",
      title: "New Follower!",
      message: `You have a new follower`,
      read: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Unfollow a user
export const unfollowUser = mutation({
  args: {
    followerId: v.string(),
    followingId: v.string(),
  },
  handler: async (ctx, args) => {
    const { followerId, followingId } = args;

    const follow = await ctx.db
      .query("follows")
      .withIndex("by_relationship", (q) =>
        q.eq("followerId", followerId).eq("followingId", followingId)
      )
      .first();

    if (!follow) {
      return { success: false, message: "Not following" };
    }

    await ctx.db.delete(follow._id);
    return { success: true };
  },
});

// Check if following
export const isFollowing = query({
  args: {
    followerId: v.string(),
    followingId: v.string(),
  },
  handler: async (ctx, args) => {
    const { followerId, followingId } = args;

    const follow = await ctx.db
      .query("follows")
      .withIndex("by_relationship", (q) =>
        q.eq("followerId", followerId).eq("followingId", followingId)
      )
      .first();

    return !!follow;
  },
});

// Get followers
export const getFollowers = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect();

    return follows.map((f) => ({
      followerId: f.followerId,
      createdAt: f.createdAt,
    }));
  },
});

// Get following
export const getFollowing = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();

    return follows.map((f) => ({
      followingId: f.followingId,
      createdAt: f.createdAt,
    }));
  },
});

// Get follower count
export const getFollowerCount = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect();

    return followers.length;
  },
});

// Get following count
export const getFollowingCount = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();

    return following.length;
  },
});
