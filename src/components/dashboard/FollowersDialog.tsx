import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFollowersList } from "@/hooks/useConvex";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface FollowersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  defaultTab?: "followers" | "following";
}

interface ProfileData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

const FollowersDialog = ({ open, onOpenChange, userId, defaultTab = "followers" }: FollowersDialogProps) => {
  const { followers, following } = useFollowersList(userId);
  const [followerProfiles, setFollowerProfiles] = useState<ProfileData[]>([]);
  const [followingProfiles, setFollowingProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!followers.length && !following.length) {
        setLoading(false);
        return;
      }

      try {
        const followerIds = followers.map(f => f.followerId);
        const followingIds = following.map(f => f.followingId);

        if (followerIds.length > 0) {
          const { data: followerData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', followerIds);
          setFollowerProfiles(followerData || []);
        }

        if (followingIds.length > 0) {
          const { data: followingData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', followingIds);
          setFollowingProfiles(followingData || []);
        }
      } catch (error) {
        console.error('Error fetching profiles:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchProfiles();
    }
  }, [open, followers, following]);

  const ProfileList = ({ profiles }: { profiles: ProfileData[] }) => (
    <ScrollArea className="h-[400px] pr-4">
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No users found
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => (
            <div key={profile.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name || 'User'} />
                <AvatarFallback>
                  {profile.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-foreground">{profile.full_name || 'Anonymous'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connections</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers">
              Followers ({followers.length})
            </TabsTrigger>
            <TabsTrigger value="following">
              Following ({following.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="followers" className="mt-4">
            <ProfileList profiles={followerProfiles} />
          </TabsContent>
          <TabsContent value="following" className="mt-4">
            <ProfileList profiles={followingProfiles} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default FollowersDialog;
