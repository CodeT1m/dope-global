import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhotoWithDetails {
  id: string;
  file_url: string;
  caption?: string;
  photographer_id: string;
  stars_count: number;
  photographer_name: string;
  is_starred: boolean;
}

const FeedTab = () => {
  const [photos, setPhotos] = useState<PhotoWithDetails[]>([]);
  const [photoOfTheDay, setPhotoOfTheDay] = useState<PhotoWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFeed = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch followed photographers
    const { data: following } = await supabase
      .from("photographer_followers")
      .select("photographer_id")
      .eq("follower_id", user.id);

    const photographerIds = following?.map(f => f.photographer_id) || [];

    // Fetch photos from followed photographers
    const { data: feedPhotos, error } = await supabase
      .from("photos")
      .select(`
        id,
        file_url,
        caption,
        photographer_id,
        profiles!photos_photographer_id_fkey(full_name)
      `)
      .in("photographer_id", photographerIds)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching feed:", error);
      setLoading(false);
      return;
    }

    // Fetch star counts and user's stars
    const photoIds = feedPhotos?.map(p => p.id) || [];
    const { data: starCounts } = await supabase
      .from("photo_stars")
      .select("photo_id, user_id")
      .in("photo_id", photoIds);

    const photosWithStars = feedPhotos?.map(photo => {
      const photoStars = starCounts?.filter(s => s.photo_id === photo.id) || [];
      return {
        id: photo.id,
        file_url: photo.file_url,
        caption: photo.caption,
        photographer_id: photo.photographer_id,
        stars_count: photoStars.length,
        photographer_name: (photo.profiles as any)?.full_name || "Unknown",
        is_starred: photoStars.some(s => s.user_id === user.id),
      };
    }) || [];

    // Find photo of the day (most starred)
    const sortedByStars = [...photosWithStars].sort((a, b) => b.stars_count - a.stars_count);
    if (sortedByStars.length > 0 && sortedByStars[0].stars_count > 0) {
      setPhotoOfTheDay(sortedByStars[0]);
    }

    setPhotos(photosWithStars);
    setLoading(false);
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const toggleStar = async (photoId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;

    if (photo.is_starred) {
      await supabase
        .from("photo_stars")
        .delete()
        .eq("photo_id", photoId)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("photo_stars")
        .insert({ photo_id: photoId, user_id: user.id });
    }

    fetchFeed();
  };

  if (loading) {
    return <div className="text-center py-8">Loading feed...</div>;
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Follow photographers to see their photos in your feed
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Photo of the Day */}
      {photoOfTheDay && (
        <Card className="overflow-hidden bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-2 border-yellow-400">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-6 w-6 text-yellow-600" />
              <h2 className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                Photo of the Day
              </h2>
            </div>
            <div className="relative">
              <img
                src={photoOfTheDay.file_url}
                alt={photoOfTheDay.caption || "Photo of the day"}
                className="w-full h-96 object-cover rounded-lg shadow-lg"
              />
              <div className="absolute bottom-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg">
                <p className="font-semibold">{photoOfTheDay.photographer_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">{photoOfTheDay.stars_count} stars</span>
                </div>
              </div>
            </div>
            {photoOfTheDay.caption && (
              <p className="mt-4 text-lg text-center">{photoOfTheDay.caption}</p>
            )}
          </div>
        </Card>
      )}

      {/* Regular Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {photos.map((photo) => (
          <Card key={photo.id} className="overflow-hidden">
            <img
              src={photo.file_url}
              alt={photo.caption || "Photo"}
              className="w-full h-64 object-cover"
            />
            <div className="p-4">
              <p className="font-semibold mb-2">{photo.photographer_name}</p>
              {photo.caption && (
                <p className="text-sm text-muted-foreground mb-3">{photo.caption}</p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">{photo.stars_count}</span>
                </div>
                <Button
                  size="sm"
                  variant={photo.is_starred ? "default" : "outline"}
                  onClick={() => toggleStar(photo.id)}
                >
                  <Star className={`h-4 w-4 mr-1 ${photo.is_starred ? "fill-current" : ""}`} />
                  {photo.is_starred ? "Starred" : "Star"}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FeedTab;
