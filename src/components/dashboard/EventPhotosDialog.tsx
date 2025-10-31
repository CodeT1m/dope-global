import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Trash2 } from "lucide-react";

interface Photo {
  id: string;
  file_url: string;
  thumbnail_url: string;
}

interface EventPhotosDialogProps {
  eventId: string;
  eventTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EventPhotosDialog = ({ eventId, eventTitle, open, onOpenChange }: EventPhotosDialogProps) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPhotos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching photos:", error);
    } else {
      setPhotos(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      fetchPhotos();
      setSelectedPhotos([]);
    }
  }, [open, eventId]);

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${eventId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('event-photos')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('event-photos')
          .getPublicUrl(fileName);

        const { error: photoError } = await supabase
          .from('photos')
          .insert({
            event_id: eventId,
            photographer_id: user.id,
            file_url: publicUrl,
            thumbnail_url: publicUrl
          });

        if (photoError) throw photoError;
      }

      toast({
        title: "Success!",
        description: `${files.length} photo(s) uploaded successfully`,
      });
      fetchPhotos();
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

  const handleDeleteSelected = async () => {
    if (selectedPhotos.length === 0) return;
    if (!confirm(`Delete ${selectedPhotos.length} photo(s)?`)) return;

    try {
      const { error } = await supabase
        .from("photos")
        .delete()
        .in("id", selectedPhotos);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `${selectedPhotos.length} photo(s) deleted`,
      });
      setSelectedPhotos([]);
      fetchPhotos();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev =>
      prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Photos - {eventTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-3">
            <Label htmlFor="photo-upload" className="cursor-pointer">
              <Button variant="outline" size="sm" asChild disabled={uploading}>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload Photos"}
                </span>
              </Button>
            </Label>
            <Input
              id="photo-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handlePhotoUpload(e.target.files)}
            />

            {selectedPhotos.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedPhotos.length})
              </Button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading photos...</div>
          ) : photos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No photos uploaded yet</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={selectedPhotos.includes(photo.id)}
                      onCheckedChange={() => togglePhotoSelection(photo.id)}
                      className="bg-background"
                    />
                  </div>
                  <img
                    src={photo.thumbnail_url}
                    alt="Event photo"
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventPhotosDialog;
