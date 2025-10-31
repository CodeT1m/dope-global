import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2, Linkedin } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ProfileTabProps {
  userId: string;
}

const ProfileTab = ({ userId }: ProfileTabProps) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [profile, setProfile] = useState({
    full_name: "",
    bio: "",
    avatar_url: "",
    instagram_handle: "",
    x_handle: "",
    linkedin_url: "",
    behance_url: "",
  });

  const [location, setLocation] = useState("");

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
    } else if (data) {
      setProfile({
        full_name: data.full_name || "",
        bio: data.bio || "",
        avatar_url: data.avatar_url || "",
        instagram_handle: data.instagram_handle || "",
        x_handle: data.x_handle || "",
        linkedin_url: data.linkedin_url || "",
        behance_url: data.behance_url || "",
      });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Create avatars bucket if it doesn't exist
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.find(b => b.name === 'avatars')) {
        await supabase.storage.createBucket('avatars', { public: true });
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfile({ ...profile, avatar_url: publicUrl });

      toast({
        title: "Avatar uploaded",
        description: "Your profile picture has been updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          instagram_handle: profile.instagram_handle,
          x_handle: profile.x_handle,
          linkedin_url: profile.linkedin_url,
          behance_url: profile.behance_url,
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInConnect = async () => {
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'linkedin_oidc',
      });

      if (error) throw error;

      toast({
        title: "LinkedIn Connected",
        description: "Your LinkedIn account has been linked",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>

        {/* Avatar Upload */}
        <div className="mb-6">
          <Label className="mb-2 block">Profile Picture</Label>
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                  {profile.full_name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <Button variant="outline" asChild disabled={uploading}>
                  <span>
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        Change Photo
                      </>
                    )}
                  </span>
                </Button>
              </Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              placeholder="John Doe"
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Kuala Lumpur, Malaysia"
            />
          </div>
        </div>
      </Card>

      {/* Social Links */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Social Links</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="instagram">Instagram Handle</Label>
            <Input
              id="instagram"
              value={profile.instagram_handle}
              onChange={(e) => setProfile({ ...profile, instagram_handle: e.target.value })}
              placeholder="@username"
            />
          </div>

          <div>
            <Label htmlFor="x">X (Twitter) Handle</Label>
            <Input
              id="x"
              value={profile.x_handle}
              onChange={(e) => setProfile({ ...profile, x_handle: e.target.value })}
              placeholder="@username"
            />
          </div>

          <div>
            <Label htmlFor="linkedin">LinkedIn URL</Label>
            <div className="flex gap-2">
              <Input
                id="linkedin"
                value={profile.linkedin_url}
                onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/username"
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleLinkedInConnect}
                title="Connect LinkedIn account"
              >
                <Linkedin className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="behance">Behance URL</Label>
            <Input
              id="behance"
              value={profile.behance_url}
              onChange={(e) => setProfile({ ...profile, behance_url: e.target.value })}
              placeholder="https://behance.net/username"
            />
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="gradient-primary"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default ProfileTab;