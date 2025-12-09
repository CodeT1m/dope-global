import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Share2 } from "lucide-react";

interface LinkedInPostPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventTitle: string;
  selectedPhotos?: string[];
  photos?: { id: string; file_url: string }[];
}

const LinkedInPostPanel = ({
  open,
  onOpenChange,
  eventTitle,
  selectedPhotos = [],
  photos = []
}: LinkedInPostPanelProps) => {
  const [tone, setTone] = useState<string>("Professional");
  const [takeaways, setTakeaways] = useState("");
  const [generatedPost, setGeneratedPost] = useState("");
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const handleGeneratePost = async () => {
    if (!takeaways.trim()) {
      toast({
        title: "Missing Information",
        description: "Please share your takeaways from the event",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const selectedPhotoUrls = photos
        .filter(p => selectedPhotos.includes(p.id))
        .map(p => p.file_url);

      const { data, error } = await supabase.functions.invoke('generate-linkedin-post', {
        body: {
          takeaways,
          tone,
          includeEmojis,
          eventTitle,
          imageUrls: selectedPhotoUrls,
        }
      });

      if (error) throw error;

      setGeneratedPost(data.post);
      toast({
        title: "Post Generated!",
        description: "Your LinkedIn post is ready. Feel free to edit it before sharing.",
      });
    } catch (error: any) {
      console.error("Error generating post:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate LinkedIn post",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(url, '_blank');
    }
  };

  const handleShareToLinkedIn = async () => {
    // 1. Prepare LinkedIn URL with pre-filled text
    // Note: LinkedIn only supports text pre-fill via this specific feed URL pattern on desktop
    const linkedInUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(generatedPost)}`;

    // 2. Copy post to clipboard as backup
    try {
      await navigator.clipboard.writeText(generatedPost);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }

    // 3. Download selected photos
    const selectedPhotoUrls = photos
      .filter(p => selectedPhotos.includes(p.id))
      .map(p => ({ url: p.file_url, id: p.id }));

    if (selectedPhotoUrls.length > 0) {
      toast({
        title: "Text Copied to Clipboard!",
        description: `Downloading ${selectedPhotoUrls.length} photo(s). Please drag & drop them into the LinkedIn window.`,
        duration: 5000,
      });

      // Download images sequentially
      for (const photo of selectedPhotoUrls) {
        await downloadImage(photo.url, `photo-${photo.id}.jpg`);
      }
    } else {
      toast({
        title: "Text Copied to Clipboard!",
        description: "Opening LinkedIn... Paste the text to publish.",
      });
    }

    // 4. Open LinkedIn in new tab
    window.open(linkedInUrl, '_blank');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Generate LinkedIn Post</SheetTitle>
          <SheetDescription>
            Share your experience from {eventTitle}
          </SheetDescription>
        </SheetHeader>

        {selectedPhotos.length > 0 && (
          <div className="mt-6">
            <Label className="mb-2 block">Selected Photos ({selectedPhotos.length})</Label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {photos
                .filter(p => selectedPhotos.includes(p.id))
                .map(photo => (
                  <img
                    key={photo.id}
                    src={photo.file_url}
                    alt="Selected"
                    className="h-20 w-20 object-cover rounded-md flex-shrink-0"
                  />
                ))}
            </div>
          </div>
        )}

        <div className="space-y-6 mt-6">
          {/* Tone Selection */}
          <div className="space-y-2">
            <Label htmlFor="tone">Post Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger id="tone">
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Formal">Formal</SelectItem>
                <SelectItem value="Casual">Casual</SelectItem>
                <SelectItem value="Creative">Creative</SelectItem>
                <SelectItem value="Professional">Professional</SelectItem>
                <SelectItem value="Rant">Rant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Takeaways Input */}
          <div className="space-y-2">
            <Label htmlFor="takeaways">Your Takeaways</Label>
            <Textarea
              id="takeaways"
              placeholder="What did you learn? Who did you meet? What inspired you?"
              value={takeaways}
              onChange={(e) => setTakeaways(e.target.value)}
              rows={4}
            />
          </div>

          {/* Include Emojis */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="emojis"
              checked={includeEmojis}
              onCheckedChange={(checked) => setIncludeEmojis(checked as boolean)}
            />
            <Label htmlFor="emojis" className="cursor-pointer">
              Include Emojis
            </Label>
          </div>

          {/* Generated Post */}
          {generatedPost && (
            <div className="space-y-2">
              <Label htmlFor="generated">Generated Post</Label>
              <Textarea
                id="generated"
                value={generatedPost}
                onChange={(e) => setGeneratedPost(e.target.value)}
                rows={12}
                className="font-sans"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleGeneratePost}
              disabled={generating}
              className="w-full gradient-primary"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Post
                </>
              )}
            </Button>

            {generatedPost && (
              <Button
                onClick={handleShareToLinkedIn}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Share2 className="h-5 w-5 mr-2" />
                Share to LinkedIn
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LinkedInPostPanel;
