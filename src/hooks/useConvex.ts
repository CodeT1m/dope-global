import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "convex/react";

// Import Convex API - will be generated after running `npx convex dev`
// @ts-ignore - Generated during Convex setup
import { api } from "../../convex/_generated/api";

export function useFollow(userId: string, targetUserId: string) {
  const { toast } = useToast();
  
  const isFollowing = useQuery(api.follows.isFollowing, 
    userId && targetUserId ? { followerId: userId, followingId: targetUserId } : "skip"
  ) ?? false;
  
  const followerCount = useQuery(api.follows.getFollowerCount, 
    targetUserId ? { userId: targetUserId } : "skip"
  ) ?? 0;

  const followUserMutation = useMutation(api.follows.followUser);
  const unfollowUserMutation = useMutation(api.follows.unfollowUser);

  const handleFollow = async () => {
    if (!userId || !targetUserId) {
      toast({
        title: "Error",
        description: "Please log in to follow users",
        variant: "destructive",
      });
      return;
    }

    try {
      await followUserMutation({ followerId: userId, followingId: targetUserId });
      toast({
        title: "Success",
        description: "You are now following this user",
      });
    } catch (error) {
      console.error("Follow error:", error);
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive",
      });
    }
  };

  const handleUnfollow = async () => {
    if (!userId || !targetUserId) return;

    try {
      await unfollowUserMutation({ followerId: userId, followingId: targetUserId });
      toast({
        title: "Success",
        description: "You have unfollowed this user",
      });
    } catch (error) {
      console.error("Unfollow error:", error);
      toast({
        title: "Error",
        description: "Failed to unfollow user",
        variant: "destructive",
      });
    }
  };

  return {
    isFollowing,
    followerCount,
    handleFollow,
    handleUnfollow,
  };
}

export function useFollowersList(userId: string) {
  const followers = useQuery(api.follows.getFollowers, 
    userId ? { userId } : "skip"
  ) ?? [];
  
  const following = useQuery(api.follows.getFollowing, 
    userId ? { userId } : "skip"
  ) ?? [];

  return {
    followers,
    following,
    followerCount: followers.length,
    followingCount: following.length,
  };
}

export function useNotifications(userId: string) {
  const notifications = useQuery(api.notifications.getUserNotifications, 
    userId ? { userId, limit: 50 } : "skip"
  ) ?? [];
  
  const unreadCount = useQuery(api.notifications.getUnreadCount, 
    userId ? { userId } : "skip"
  ) ?? 0;

  const markAsReadMutation = useMutation(api.notifications.markAsRead);
  const markAllAsReadMutation = useMutation(api.notifications.markAllAsRead);

  const markAsRead = async (notificationId: any) => {
    try {
      await markAsReadMutation({ notificationId });
    } catch (error) {
      console.error("Mark as read error:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    try {
      await markAllAsReadMutation({ userId });
    } catch (error) {
      console.error("Mark all as read error:", error);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}

export function usePresence(userId: string) {
  const updatePresenceMutation = useMutation(api.presence.updatePresence);

  useEffect(() => {
    if (!userId) return;

    const updateStatus = async (status: string) => {
      try {
        await updatePresenceMutation({ userId, status });
      } catch (error) {
        console.error("Presence update error:", error);
      }
    };

    updateStatus("online");

    const interval = setInterval(() => {
      updateStatus("online");
    }, 30000);

    const handleVisibilityChange = () => {
      updateStatus(document.hidden ? "away" : "online");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      updateStatus("offline");
    };
  }, [userId, updatePresenceMutation]);
}

export function useChat(userId: string, otherUserId: string) {
  const conversationId = [userId, otherUserId].sort().join("-");
  
  const messages = useQuery(api.messages.getConversation, 
    userId && otherUserId ? { conversationId } : "skip"
  ) ?? [];
  
  const unreadCount = useQuery(api.messages.getUnreadMessageCount, 
    userId ? { userId } : "skip"
  ) ?? 0;

  const sendMessageMutation = useMutation(api.messages.sendMessage);
  const markAsReadMutation = useMutation(api.messages.markMessagesAsRead);

  const sendMessage = async (content: string) => {
    if (!userId || !otherUserId || !content.trim()) return;

    try {
      await sendMessageMutation({
        senderId: userId,
        receiverId: otherUserId,
        content: content.trim(),
        conversationId,
      });
    } catch (error) {
      console.error("Send message error:", error);
      throw error;
    }
  };

  const markAsRead = async () => {
    if (!userId || !conversationId) return;

    try {
      await markAsReadMutation({ conversationId, userId });
    } catch (error) {
      console.error("Mark as read error:", error);
    }
  };

  return {
    messages,
    unreadCount,
    sendMessage,
    markAsRead,
  };
}
