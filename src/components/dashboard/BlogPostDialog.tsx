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
import { Loader2, Sparkles, Plus, X, Share2 } from "lucide-react";

interface Photo {
  id: string;
  public_url: string;
  caption?: string;
}

interface BlogPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
}

interface Organizer {
  name: string;
  linkedInUrl: string;
}

const BlogPostDialog = ({ open, onOpenChange, eventId, eventTitle }: BlogPostDialogProps) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [takeaways, setTakeaways] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [category, setCategory] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [tagTimi, setTagTimi] = useState(false);
  const [organizers, setOrganizers] = useState<Organizer[]>([{ name: "", linkedInUrl: "" }]);
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
      .from("images")
      .select("id, public_url, caption")
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

  const addOrganizer = () => {
    setOrganizers([...organizers, { name: "", linkedInUrl: "" }]);
  };

  const removeOrganizer = (index: number) => {
    if (organizers.length > 1) {
      setOrganizers(organizers.filter((_, i) => i !== index));
    }
  };

  const updateOrganizer = (index: number, field: 'name' | 'linkedInUrl', value: string) => {
    const updated = [...organizers];
    updated[index][field] = value;
    setOrganizers(updated);
  };

  const handleGeneratePost = async () => {
    if (!takeaways.trim()) {
      toast({
        title: "Error",
        description: "Please provide your takeaways first",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-linkedin-post', {
        body: {
          takeaways: takeaways,
          eventTitle: eventTitle,
          category: category || "General",
          organizers: organizers.filter(o => o.name.trim())
        }
      });

      if (error) throw error;

      setGeneratedContent(data.post);
      toast({
        title: "Success",
        description: "AI-generated blog post is ready!",
      });
    } catch (error: any) {
      console.error("Error generating post:", error);
      toast({
        title: "Error",
        description: "Failed to generate blog post",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || !generatedContent.trim() || !selectedPhotoId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and generate content",
        variant: "destructive",
      });
      return;
    }

    setPublishing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const hashtagArray = hashtags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag)
        .map(tag => tag.startsWith('#') ? tag : `#${tag}`);

      if (!hashtagArray.includes('#DOPE')) {
        hashtagArray.unshift('#DOPE');
      }

      const organizerInfo = organizers
        .filter(o => o.name.trim())
        .map(o => `${o.name}${o.linkedInUrl ? ` (${o.linkedInUrl})` : ''}`)
        .join(', ');

      const finalContent = `${generatedContent}\n\n${organizerInfo ? `Event Organizers: ${organizerInfo}\n\n` : ''}${hashtagArray.join(' ')}`;

      const { error } = await supabase.from("blog_posts").insert({
        event_id: eventId,
        photographer_id: user.id,
        title,
        content: finalContent,
        cover_photo_id: selectedPhotoId,
        category: category || "General",
        hashtags: hashtagArray,
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
    setTakeaways("");
    setGeneratedContent("");
    setCategory("");
    setHashtags("");
    setTagTimi(false);
    setOrganizers([{ name: "", linkedInUrl: "" }]);
    setSelectedPhotoId("");
  };

  const selectedPhoto = photos.find(p => p.id === selectedPhotoId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Blog Post - {eventTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
            <Label htmlFor="category">Category (Optional)</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-card z-50">
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
              <SelectContent className="bg-card z-50">
                {photos.map((photo) => (
                  <SelectItem key={photo.id} value={photo.id}>
                    <div className="flex items-center gap-2">
                      <img
                        src={photo.public_url}
                        alt={photo.caption || "Photo"}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <span>{photo.caption || `Photo ${photo.id.slice(0, 8)}`}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPhoto && (
              <div className="mt-3">
                <img
                  src={selectedPhoto.public_url}
                  alt="Selected cover"
                  className="w-full h-48 object-contain rounded-lg border border-border"
                />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Organizers</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOrganizer}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Organizer
              </Button>
            </div>
            <div className="space-y-3">
              {organizers.map((organizer, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Organizer name"
                      value={organizer.name}
                      onChange={(e) => updateOrganizer(index, 'name', e.target.value)}
                    />
                    <Input
                      placeholder="LinkedIn URL (optional)"
                      value={organizer.linkedInUrl}
                      onChange={(e) => updateOrganizer(index, 'linkedInUrl', e.target.value)}
                    />
                  </div>
                  {organizers.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOrganizer(index)}
                      className="mt-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="hashtags">Hashtags (comma-separated)</Label>
            <Input
              id="hashtags"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="photography, event, community"
            />
            <p className="text-xs text-muted-foreground mt-1">
              #DOPE will be automatically included
            </p>
          </div>

          <div>
            <Label htmlFor="takeaways">Your Takeaways & Instructions for AI</Label>
            <Textarea
              id="takeaways"
              value={takeaways}
              onChange={(e) => setTakeaways(e.target.value)}
              placeholder="Share your key takeaways from the event and any specific instructions for how you want the blog post to be written..."
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              The AI will use your takeaways and category to generate a blog post in the appropriate style
            </p>
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
                Generate Blog Post with AI
              </>
            )}
          </Button>

          {generatedContent && (
            <div>
              <Label>Generated Blog Post</Label>
              <Textarea
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                rows={12}
                className="resize-none mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                You can edit the generated content before publishing
              </p>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="tag-timi"
              checked={tagTimi}
              onCheckedChange={(checked) => setTagTimi(checked as boolean)}
            />
            <Label
              htmlFor="tag-timi"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Tag Timi in this post
            </Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handlePublish}
              disabled={publishing || !generatedContent}
              className="flex-1"
            >
              {publishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                "Publish Blog Post"
              )}
            </Button>
            <Button
              onClick={handleShareToLinkedIn}
              variant="outline"
              disabled={!generatedContent}
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
