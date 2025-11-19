import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, UserMinus, Star, Camera, Users } from "lucide-react";
import { useFollow, useFollowersList } from "@/hooks/useConvex";

interface UserCardProps {
  user: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    is_photographer?: boolean;
  };
  currentUserId: string;
  onReview: () => void;
  onViewFollowers: () => void;
}

const UserCard = ({ user, currentUserId, onReview, onViewFollowers }: UserCardProps) => {
  const { isFollowing, followerCount, handleFollow, handleUnfollow } = useFollow(currentUserId, user.id);
  const isOwnProfile = currentUserId === user.id;

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-300 border-border/50 bg-card">
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16 border-2 border-primary/20">
          <AvatarImage src={user.avatar_url || ''} alt={user.full_name || 'User'} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {user.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-foreground truncate">
              {user.full_name || 'Anonymous User'}
            </h3>
            {user.is_photographer && (
              <Badge variant="secondary" className="gap-1">
                <Camera className="h-3 w-3" />
                Photographer
              </Badge>
            )}
          </div>
          
          <button
            onClick={onViewFollowers}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Users className="h-4 w-4" />
            {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
          </button>

          {user.is_photographer && !isOwnProfile && (
            <div className="flex gap-2 mt-4">
              <Button
                onClick={isFollowing ? handleUnfollow : handleFollow}
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                className="gap-2"
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="h-4 w-4" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Follow
                  </>
                )}
              </Button>
              
              <Button
                onClick={onReview}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Star className="h-4 w-4" />
                Review
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default UserCard;
