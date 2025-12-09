import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2, Linkedin, Trash2 } from "lucide-react";
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
      });
      setLocation(data.location || "");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

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

      // Update profile with new avatar URL immediately and save
      const newProfile = { ...profile, avatar_url: publicUrl };
      setProfile(newProfile);

      // Save the avatar update to DB immediately
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

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

  const handleRemoveAvatar = async () => {
    if (!profile.avatar_url) return;

    setUploading(true);
    try {
      // Clear avatar URL in state immediately
      const newProfile = { ...profile, avatar_url: "" };
      setProfile(newProfile);

      // Update DB
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", userId);

      if (updateError) throw updateError;

      toast({
        title: "Avatar removed",
        description: "Your profile picture has been removed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      // Revert state if error
      setProfile({ ...profile, avatar_url: profile.avatar_url });
    } finally {
      setUploading(false);
    }
  };

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerAutoSave = (updatedProfile: typeof profile, updatedLocation: string) => {
    setLoading(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({
            full_name: updatedProfile.full_name,
            bio: updatedProfile.bio,
            avatar_url: updatedProfile.avatar_url,
            instagram_handle: updatedProfile.instagram_handle,
            x_handle: updatedProfile.x_handle,
            linkedin_url: updatedProfile.linkedin_url,
            location: updatedLocation,
          })
          .eq("id", userId);

        if (error) throw error;

        // Optional: toast on success for auto-save might be too noisy, keeping it subtle or removing
        // toast({ title: "Saved", duration: 1000 }); 
      } catch (error: any) {
        toast({
          title: "Error saving changes",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }, 1000);
  };

  const updateProfileField = (field: keyof typeof profile, value: string) => {
    const newProfile = { ...profile, [field]: value };
    setProfile(newProfile);
    triggerAutoSave(newProfile, location);
  };

  const updateLocation = (value: string) => {
    setLocation(value);
    triggerAutoSave(profile, value);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Profile Settings</h2>
          {loading && (
            <span className="text-sm text-muted-foreground flex items-center animate-pulse">
              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
              Saving...
            </span>
          )}
        </div>

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
            <div className="flex flex-col gap-2">
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

              {profile.avatar_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 justify-start px-2 h-8"
                  onClick={handleRemoveAvatar}
                  disabled={uploading}
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Remove Photo
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-6">
          <div>
            <Label htmlFor="full_name" className="text-base font-semibold">Full Name</Label>
            <Input
              id="full_name"
              value={profile.full_name}
              onChange={(e) => updateProfileField("full_name", e.target.value)}
              placeholder="John Doe"
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profile.bio}
              onChange={(e) => updateProfileField("bio", e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => updateLocation(e.target.value)}
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
              onChange={(e) => updateProfileField("instagram_handle", e.target.value)}
              placeholder="@username"
            />
          </div>

          <div>
            <Label htmlFor="x">X (Twitter) Handle</Label>
            <Input
              id="x"
              value={profile.x_handle}
              onChange={(e) => updateProfileField("x_handle", e.target.value)}
              placeholder="@username"
            />
          </div>

          <div>
            <Label htmlFor="linkedin">LinkedIn URL</Label>
            <div className="flex gap-2">
              <Input
                id="linkedin"
                value={profile.linkedin_url}
                onChange={(e) => updateProfileField("linkedin_url", e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Save Button Removed - Auto-save implemented */}
    </div>
  );
};

export default ProfileTab;