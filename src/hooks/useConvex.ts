import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useToast } from "@/hooks/use-toast";

export function useFollow(userId: string, targetUserId: string) {
  const { toast } = useToast();

  const isFollowing = useQuery(api.follows.isFollowing, {
    followerId: userId,
    followingId: targetUserId,
  });

  const followerCount = useQuery(api.follows.getFollowerCount, {
    userId: targetUserId,
  });

  const follow = useMutation(api.follows.followUser);
  const unfollow = useMutation(api.follows.unfollowUser);

  const handleFollow = async () => {
    try {
      await follow({ followerId: userId, followingId: targetUserId });
      toast({ title: "Following", description: "You are now following this user" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to follow user", variant: "destructive" });
    }
  };

  const handleUnfollow = async () => {
    try {
      await unfollow({ followerId: userId, followingId: targetUserId });
      toast({ title: "Unfollowed", description: "You have unfollowed this user" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to unfollow user", variant: "destructive" });
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
  const followers = useQuery(api.follows.getFollowers, { userId });
  const following = useQuery(api.follows.getFollowing, { userId });
  const followerCount = useQuery(api.follows.getFollowerCount, { userId });
  const followingCount = useQuery(api.follows.getFollowingCount, { userId });

  return {
    followers: followers || [],
    following: following || [],
    followerCount: followerCount || 0,
    followingCount: followingCount || 0,
  };
}

export function usePhotoCount(userId: string) {
  const photoCount = useQuery(api.uploads.getTotalPhotoCount, { photographerId: userId });
  return photoCount || 0;
}
