import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface Photo {
  id: string;
  public_url: string;
  caption?: string;
}

interface PhotoSlideshowProps {
  photos: Photo[];
  currentIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIndexChange: (index: number) => void;
}

const PhotoSlideshow = ({
  photos,
  currentIndex,
  open,
  onOpenChange,
  onIndexChange,
}: PhotoSlideshowProps) => {
  const currentPhoto = photos[currentIndex];

  const handlePrevious = () => {
    onIndexChange(currentIndex > 0 ? currentIndex - 1 : photos.length - 1);
  };

  const handleNext = () => {
    onIndexChange(currentIndex < photos.length - 1 ? currentIndex + 1 : 0);
  };

  if (!open || !currentPhoto) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
        <div className="relative w-full h-full flex items-center justify-center bg-black/90">


          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>

          <div className="flex flex-col items-center justify-center p-12">
            <img
              src={currentPhoto.public_url}
              alt={currentPhoto?.caption || "Photo"}
              className="max-w-full max-h-[80vh] object-contain"
            />
            {currentPhoto?.caption && (
              <p className="text-white mt-4 text-center">{currentPhoto.caption}</p>
            )}
            <p className="text-white/60 text-sm mt-2">
              {currentIndex + 1} / {photos.length}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoSlideshow;
