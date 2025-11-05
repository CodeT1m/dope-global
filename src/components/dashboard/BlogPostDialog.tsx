import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Share2 } from "lucide-react";

interface Photo {
  id: string;
  file_url: string;
  caption?: string;
}

interface BlogPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
}

const BlogPostDialog = ({ open, onOpenChange, eventId, eventTitle }: BlogPostDialogProps) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tagTimi, setTagTimi] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchPhotos();
      setTitle(`Highlights from ${eventTitle}`);
    }
  }, [open, eventId, eventTitle]);

  const fetchPhotos = async () => {
    const { data, error } = await supabase
      .from("photos")
      .select("id, file_url, caption")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching photos:", error);
    } else {
      setPhotos(data || []);
      if (data && data.length > 0) {
        setSelectedPhotoId(data[0].id);
      }
    }
  };

  const handleGeneratePost = async () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please provide some details about the event first",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-linkedin-post', {
        body: { 
          eventDetails: content,
          eventTitle: eventTitle,
          category: category || "Event Recap"
        }
      });

      if (error) throw error;

      setContent(data.post);
      toast({
        title: "Success",
        description: "AI-generated post is ready!",
      });
    } catch (error: any) {
      console.error("Error generating post:", error);
      toast({
        title: "Error",
        description: "Failed to generate post",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || !content.trim() || !selectedPhotoId || !category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setPublishing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const hashtags = ["#DOPE", "#CommunityEvents", `#${category.replace(/\s+/g, '')}`];

      const { error } = await supabase.from("blog_posts").insert({
        event_id: eventId,
        photographer_id: user.id,
        title,
        content: `${content}\n\n${hashtags.join(' ')}\n\nCredits to #DOPE community`,
        cover_photo_id: selectedPhotoId,
        category,
        hashtags,
        tag_timi: tagTimi,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Blog post published successfully!",
      });
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error("Error publishing blog post:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to publish blog post",
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleShareToLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}`;
    window.open(linkedInUrl, '_blank');
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setCategory("");
    setSelectedPhotoId("");
    setTagTimi(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Blog Post - {eventTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter blog post title"
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Event Recap">Event Recap</SelectItem>
                <SelectItem value="Behind the Scenes">Behind the Scenes</SelectItem>
                <SelectItem value="Highlights">Highlights</SelectItem>
                <SelectItem value="Community Stories">Community Stories</SelectItem>
                <SelectItem value="Photography Tips">Photography Tips</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="cover-photo">Cover Photo</Label>
            <Select value={selectedPhotoId} onValueChange={setSelectedPhotoId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a photo" />
              </SelectTrigger>
              <SelectContent>
                {photos.map((photo) => (
                  <SelectItem key={photo.id} value={photo.id}>
                    {photo.caption || `Photo ${photo.id.slice(0, 8)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPhotoId && (
              <div className="mt-2">
                <img
                  src={photos.find(p => p.id === selectedPhotoId)?.file_url}
                  alt="Selected cover"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your blog post or generate with AI..."
              rows={10}
              className="resize-none"
            />
          </div>

          <Button
            onClick={handleGeneratePost}
            disabled={generating}
            variant="outline"
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Post with AI
              </>
            )}
          </Button>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="tag-timi"
              checked={tagTimi}
              onCheckedChange={(checked) => setTagTimi(checked as boolean)}
            />
            <label htmlFor="tag-timi" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Tag Timi for a repost
            </label>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handlePublish}
              disabled={publishing}
              className="flex-1"
            >
              {publishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                "Publish to Blog"
              )}
            </Button>
            <Button
              onClick={handleShareToLinkedIn}
              variant="outline"
              className="flex-1"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share to LinkedIn
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlogPostDialog;
