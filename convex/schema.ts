import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Follow relationships
  follows: defineTable({
    followerId: v.string(),
    followingId: v.string(),
    createdAt: v.number(),
  })
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"])
    .index("by_relationship", ["followerId", "followingId"]),

  // Real-time notifications
  notifications: defineTable({
    userId: v.string(),
    type: v.string(), // "face_match", "new_follower", "message", "upload"
    title: v.string(),
    message: v.string(),
    metadata: v.optional(v.any()),
    read: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId", "createdAt"]),

  // Chat messages
  messages: defineTable({
    senderId: v.string(),
    receiverId: v.string(),
    content: v.string(),
    conversationId: v.string(),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_conversation", ["conversationId", "createdAt"])
    .index("by_receiver", ["receiverId", "read"]),

  // User presence/status
  presence: defineTable({
    userId: v.string(),
    status: v.string(), // "online", "offline", "away"
    lastSeen: v.number(),
  }).index("by_user", ["userId"]),

  // Face match results
  faceMatches: defineTable({
    userId: v.string(),
    photoId: v.string(),
    eventId: v.string(),
    confidence: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId", "createdAt"])
    .index("by_photo", ["photoId"]),

  // Upload tracking
  uploads: defineTable({
    photographerId: v.string(),
    eventId: v.string(),
    photoCount: v.number(),
    status: v.string(), // "processing", "completed", "failed"
    createdAt: v.number(),
  }).index("by_photographer", ["photographerId", "createdAt"]),
});
