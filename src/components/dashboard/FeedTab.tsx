import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Flame, Award, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhotoWithDetails {
  id: string;
  file_url: string;
  caption?: string;
  photographer_id: string;
  love_count: number;
  fire_count: number;
  photographer_name: string;
  has_loved: boolean;
  has_fired: boolean;
}

interface BlogPostWithDetails {
  id: string;
  title: string;
  content: string;
  cover_photo_url?: string;
  category?: string;
  photographer_name: string;
  created_at: string;
  tag_timi: boolean;
}

const FeedTab = () => {
  const [photos, setPhotos] = useState<PhotoWithDetails[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPostWithDetails[]>([]);
  const [photoOfTheDay, setPhotoOfTheDay] = useState<PhotoWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFeed = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: following } = await supabase
      .from("photographer_followers")
      .select("photographer_id")
      .eq("follower_id", user.id);

    const photographerIds = following?.map(f => f.photographer_id) || [];

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

    const photoIds = feedPhotos?.map(p => p.id) || [];
    const { data: reactions } = await supabase
      .from("photo_reactions")
      .select("photo_id, user_id, reaction_type")
      .in("photo_id", photoIds);

    const photosWithReactions = feedPhotos?.map(photo => {
      const photoReactions = reactions?.filter(r => r.photo_id === photo.id) || [];
      const loveReactions = photoReactions.filter(r => r.reaction_type === 'love');
      const fireReactions = photoReactions.filter(r => r.reaction_type === 'fire');
      
      return {
        id: photo.id,
        file_url: photo.file_url,
        caption: photo.caption,
        photographer_id: photo.photographer_id,
        love_count: loveReactions.length,
        fire_count: fireReactions.length,
        photographer_name: (photo.profiles as any)?.full_name || "Unknown",
        has_loved: loveReactions.some(r => r.user_id === user.id),
        has_fired: fireReactions.some(r => r.user_id === user.id),
      };
    }) || [];

    const sortedByEngagement = [...photosWithReactions].sort((a, b) => 
      (b.love_count + b.fire_count) - (a.love_count + a.fire_count)
    );
    if (sortedByEngagement.length > 0 && (sortedByEngagement[0].love_count + sortedByEngagement[0].fire_count) > 0) {
      setPhotoOfTheDay(sortedByEngagement[0]);
    }

    setPhotos(photosWithReactions);
    setLoading(false);
  };

  const fetchBlogPosts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: following } = await supabase
      .from("photographer_followers")
      .select("photographer_id")
      .eq("follower_id", user.id);

    const photographerIds = following?.map(f => f.photographer_id) || [];

    const { data: posts } = await supabase
      .from("blog_posts")
      .select(`
        id,
        title,
        content,
        category,
        created_at,
        tag_timi,
        photographer_id,
        profiles!blog_posts_photographer_id_fkey(full_name)
      `)
      .in("photographer_id", photographerIds)
      .order("created_at", { ascending: false })
      .limit(10);

    const formattedPosts = posts?.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category || undefined,
      created_at: post.created_at || "",
      tag_timi: post.tag_timi || false,
      photographer_name: (post.profiles as any)?.full_name || "Unknown",
    })) || [];

    setBlogPosts(formattedPosts);
  };

  useEffect(() => {
    fetchFeed();
    fetchBlogPosts();
  }, []);

  const toggleReaction = async (photoId: string, reactionType: 'love' | 'fire') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;

    const hasReacted = reactionType === 'love' ? photo.has_loved : photo.has_fired;

    if (hasReacted) {
      await supabase.from("photo_reactions").delete()
        .eq("photo_id", photoId).eq("user_id", user.id).eq("reaction_type", reactionType);
    } else {
      await supabase.from("photo_reactions").insert({ photo_id: photoId, user_id: user.id, reaction_type: reactionType });
    }
    fetchFeed();
  };

  if (loading) return <div className="text-center py-8">Loading feed...</div>;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="photos" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="posts">Blog Posts</TabsTrigger>
        </TabsList>

        <TabsContent value="photos" className="space-y-6 mt-6">
          {photoOfTheDay && (
            <Card className="p-6 gradient-card">
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-6 w-6 text-yellow-500" />
                <h3 className="text-xl font-bold">Photo of the Day</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <img src={photoOfTheDay.file_url} alt={photoOfTheDay.caption || "Photo"} className="w-full aspect-video object-cover rounded-lg" />
                <div className="space-y-4">
                  {photoOfTheDay.caption && <p className="text-muted-foreground">{photoOfTheDay.caption}</p>}
                  <p className="text-sm">By <span className="font-semibold">{photoOfTheDay.photographer_name}</span></p>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2"><Heart className="h-4 w-4 text-red-500" /><span className="text-sm">{photoOfTheDay.love_count}</span></div>
                    <div className="flex items-center gap-2"><Flame className="h-4 w-4 text-orange-500" /><span className="text-sm">{photoOfTheDay.fire_count}</span></div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <div className="grid gap-6">
            {photos.map((photo) => (
              <Card key={photo.id} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{photo.photographer_name}</p>
                    <Button variant="ghost" size="sm"><Share2 className="h-4 w-4" /></Button>
                  </div>
                  <img src={photo.file_url} alt={photo.caption || "Photo"} className="w-full aspect-video object-cover rounded-lg" />
                  {photo.caption && <p className="text-muted-foreground">{photo.caption}</p>}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2"><Heart className="h-4 w-4 text-red-500" /><span className="text-sm">{photo.love_count}</span></div>
                      <div className="flex items-center gap-2"><Flame className="h-4 w-4 text-orange-500" /><span className="text-sm">{photo.fire_count}</span></div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant={photo.has_loved ? "default" : "outline"} onClick={() => toggleReaction(photo.id, 'love')} className={photo.has_loved ? "bg-red-500 hover:bg-red-600" : ""}>
                        <Heart className={`h-4 w-4 mr-1 ${photo.has_loved ? "fill-current" : ""}`} />Love
                      </Button>
                      <Button size="sm" variant={photo.has_fired ? "default" : "outline"} onClick={() => toggleReaction(photo.id, 'fire')} className={photo.has_fired ? "bg-orange-500 hover:bg-orange-600" : ""}>
                        <Flame className={`h-4 w-4 mr-1 ${photo.has_fired ? "fill-current" : ""}`} />Fire
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="posts" className="space-y-6 mt-6">
          {blogPosts.map((post) => (
            <Card key={post.id} className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{post.title}</h3>
                    <p className="text-sm text-muted-foreground">By {post.photographer_name} • {new Date(post.created_at).toLocaleDateString()}</p>
                  </div>
                  {post.category && <span className="text-xs px-2 py-1 bg-muted rounded">{post.category}</span>}
                </div>
                <p className="text-muted-foreground line-clamp-3">{post.content}</p>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FeedTab;
