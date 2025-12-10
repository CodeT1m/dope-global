import { useState, useEffect } from "react";
import { uploadToR2 } from "@/utils/r2storage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2 } from "lucide-react";

interface Photo {
  id: string;
  public_url: string;
  thumbnail_url?: string;
  caption?: string;
  created_at: string;
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPhotos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("images")
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to upload photos",
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    try {
      const totalFiles = files.length;

      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];

        // Use R2 Upload
        const uploadResult = await uploadToR2(file, `Events/${eventTitle}`);

        if (!uploadResult.success) {
          console.error("R2 Upload failed:", uploadResult.error);
          throw new Error(`R2 Upload failed: ${uploadResult.error?.message || 'Unknown error'}`);
        }

        const { error: insertError } = await supabase
          .from('images')
          .insert({
            event_id: eventId,
            public_url: uploadResult.url,
            storage_path: uploadResult.path,
            user_id: user.id,
          });

        if (insertError) throw insertError;

        // Update progress
        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
      }

      toast({
        title: "Success",
        description: `${totalFiles} photo(s) uploaded successfully`,
      });

      fetchPhotos();
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedPhotos.length === 0) return;
    if (!confirm(`Delete ${selectedPhotos.length} photo(s)?`)) return;

    try {
      const { error } = await supabase
        .from("images")
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

  const handleDeleteAll = async () => {
    if (photos.length === 0) return;
    if (!confirm(`Are you sure you want to delete ALL ${photos.length} photos? This action cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from("images")
        .delete()
        .eq("event_id", eventId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "All photos deleted successfully",
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
    setSelectedPhotos((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
        <div className="p-6 border-b">
          <DialogHeader>
            <DialogTitle>Manage Photos - {eventTitle}</DialogTitle>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Photos Grid */}
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading photos...</div>
            ) : photos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No photos uploaded yet</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <div className="absolute top-2 left-2 z-10">
                      <Checkbox
                        checked={selectedPhotos.includes(photo.id)}
                        onCheckedChange={() => togglePhotoSelection(photo.id)}
                        className="bg-background shadow-lg"
                      />
                    </div>
                    <img
                      src={photo.public_url}
                      alt="Event photo"
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Floating Action Bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-4 p-2 pl-4 pr-2 rounded-full border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-xl">
            <div className="flex items-center gap-3 border-r pr-4">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                {selectedPhotos.length > 0 ? `${selectedPhotos.length} selected` : `${photos.length} total`}
              </span>

              <label htmlFor="photo-upload" className="cursor-pointer">
                <div className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50">
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload"}
                </div>
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>

            <div className="flex items-center gap-2">
              {selectedPhotos.length > 0 ? (
                <Button
                  variant="destructive"
                  onClick={handleDeleteSelected}
                  size="sm"
                  className="rounded-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full"
                  onClick={handleDeleteAll}
                  size="sm"
                  disabled={photos.length === 0}
                >
                  Delete All
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventPhotosDialog;
