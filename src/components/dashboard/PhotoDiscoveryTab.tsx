import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Camera, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import LinkedInPostPanel from "./LinkedInPostPanel";
import { Check, Download, Share2 } from "lucide-react";
import { useFaceMatching } from "@/context/FaceMatchingContext";

const PhotoDiscoveryTab = () => {
  const {
    capturedImage, setCapturedImage,
    matches, setMatches,
    isSearching, setIsSearching,
    selectedPhotos, setSelectedPhotos
  } = useFaceMatching();

  const [cameraActive, setCameraActive] = useState(false);
  const [linkedInPanelOpen, setLinkedInPanelOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error: any) {
      console.error("Camera access error:", error);
      let errorMessage = "Could not access camera.";

      if (error.name === 'NotAllowedError') {
        errorMessage = "Camera permission denied. Please allow camera access in your browser settings.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No camera found on this device.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Camera is currently in use by another application.";
      }

      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageData = canvasRef.current.toDataURL("image/jpeg", 0.8);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    );
  };

  const handleDownloadSelected = async () => {
    if (selectedPhotos.length === 0) return;

    matches.filter(p => selectedPhotos.includes(p.id)).forEach(photo => {
      const link = document.createElement('a');
      link.href = photo.public_url;
      link.download = `photo-${photo.id}.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    toast({
      title: "Downloading...",
      description: `Started download for ${selectedPhotos.length} photo(s).`,
    });
  };

  const handeLinkedInClick = () => {
    if (selectedPhotos.length === 0) {
      toast({ title: "Select photos first", variant: "destructive" });
      return;
    }
    setLinkedInPanelOpen(true);
  };

  const searchPhotos = async () => {
    if (!capturedImage) {
      toast({
        title: "No Image",
        description: "Please capture or upload a photo first",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setMatches([]);

    try {
      const { data: allPhotos, error: fetchError } = await supabase
        .from('images')
        .select('id, public_url')
        .limit(200);

      if (fetchError) throw fetchError;

      if (!allPhotos || allPhotos.length === 0) {
        toast({
          title: "No Photos",
          description: "There are no photos in the gallery to search through.",
        });
        setIsSearching(false);
        return;
      }

      const res = await fetch(capturedImage);
      const blob = await res.blob();

      const formData = new FormData();
      formData.append('target', blob, 'target.jpg');
      formData.append('candidates_json', JSON.stringify(allPhotos.map(p => ({ id: p.id, url: p.public_url }))));

      const response = await fetch('http://localhost:8000/match-face/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      const foundMatches = result.matches || [];

      const uiMatches = foundMatches.map((m: any) => ({
        id: m.id,
        public_url: m.url,
        distance: m.distance
      }));

      setMatches(uiMatches);

      toast({
        title: "Search Complete",
        description: `Found ${uiMatches.length} photo(s) with matching faces!`,
      });

    } catch (error: any) {
      console.error('Error searching photos:', error);
      toast({
        title: "Search Failed",
        description: error.message || "An error occurred during face matching",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const resetCapture = () => {
    setCapturedImage(null);
    setMatches([]);
    setIsSearching(false);
    setSelectedPhotos([]);
    stopCamera();
  };

  return (
    <div className="space-y-6 relative">
      {linkedInPanelOpen && (
        <LinkedInPostPanel
          open={linkedInPanelOpen}
          onOpenChange={setLinkedInPanelOpen}
          eventTitle="My Discoveries"
          selectedPhotos={selectedPhotos}
          photos={matches.map(m => ({ id: m.id, file_url: m.file_url, thumbnail_url: m.file_url }))}
        />
      )}

      <Card className="p-8">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-2 text-foreground">
            Find Your Photos
          </h2>
          <p className="text-muted-foreground">
            Upload a selfie or take a photo to find all your event photos instantly
          </p>
        </div>

        {!capturedImage ? (
          <div className="space-y-6">
            {/* Camera View */}
            {cameraActive ? (
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video max-w-md mx-auto">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                  <Button
                    onClick={capturePhoto}
                    className="gradient-primary"
                    size="lg"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Capture
                  </Button>
                  <Button
                    onClick={stopCamera}
                    variant="outline"
                    size="lg"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-xl p-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-center filter blur-sm pointer-events-none select-none">
                  <Button
                    onClick={startCamera}
                    className="gradient-primary"
                    size="lg"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Take Selfie
                  </Button>
                  <Label htmlFor="file-upload">
                    <Button
                      variant="outline"
                      size="lg"
                      asChild
                    >
                      <span>
                        <Upload className="h-5 w-5 mr-2" />
                        Upload Photo
                      </span>
                    </Button>
                  </Label>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
                {/* Coming Soon Overlay */}
                <div className="absolute inset-0 z-20 flex items-center justify-center">
                  <div className="bg-background/80 backdrop-blur-md px-6 py-2 rounded-full border shadow-lg">
                    <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                      Coming Soon 🚀
                    </span>
                  </div>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-center">
              <img
                src={capturedImage}
                alt="Captured"
                className="max-w-md w-full rounded-lg border-2 border-primary object-cover"
              />
            </div>
            <div className="flex justify-center gap-4">
              <Button
                onClick={searchPhotos}
                disabled={isSearching}
                className="gradient-primary"
                size="lg"
              >
                {isSearching ? (
                  <>
                    <span className="animate-pulse mr-2">🔍</span> Searching...
                  </>
                ) : (
                  <>Find My Photos</>
                )}
              </Button>
              <Button
                onClick={resetCapture}
                variant="outline"
                size="lg"
                disabled={isSearching}
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6 bg-muted/50 pb-24 min-h-[300px] relative overflow-hidden">
        {/* Coming Soon Overlay */}
        <div className="absolute inset-0 z-20 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
          <div className="bg-primary/10 border border-primary/20 backdrop-blur-md px-8 py-4 rounded-full shadow-2xl transform hover:scale-105 transition-transform duration-300">
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 animate-pulse">
              Coming Soon 🚀
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4 filter blur-[1px]">
          <h3 className="font-bold text-xl">
            <span className="text-gradient">Memory Lane</span>
          </h3>
          {matches.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {matches.length} matches found
            </div>
          )}
        </div>

        <div className="filter blur-[1px] pointer-events-none">
          {matches.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {matches.map((photo) => {
                const isSelected = selectedPhotos.includes(photo.id);
                return (
                  <div
                    key={photo.id}
                    className={`relative group rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-xl ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                    onClick={() => togglePhotoSelection(photo.id)}
                  >
                    <img
                      src={photo.file_url}
                      alt="Matched memory"
                      loading="lazy"
                      className="w-full aspect-square object-cover transition-transform group-hover:scale-105 duration-300"
                    />
                    <div className={`absolute top-2 right-2 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors shadow-sm ${isSelected ? 'bg-primary border-primary' : 'bg-black/40 border-white hover:bg-black/60'}`}>
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    {photo.distance && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-[10px] p-2 pt-4 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                        Match: {((1 - photo.distance) * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 flex flex-col items-center justify-center text-muted-foreground">
              {isSearching ? (
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <p>Scanning gallery with AI...</p>
                </div>
              ) : (
                <>
                  <p className="mb-2">{capturedImage ? "No matching photos found." : "Upload a selfie to start traveling down memory lane."}</p>
                </>
              )}
            </div>
          )}
        </div>
      </Card>

      {selectedPhotos.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background/95 backdrop-blur-md shadow-2xl border rounded-full px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <span className="text-sm font-medium mr-2 whitespace-nowrap">{selectedPhotos.length} selected</span>
          <div className="h-4 w-px bg-border"></div>
          <Button size="sm" variant="ghost" onClick={handleDownloadSelected} className="gap-2 rounded-full hover:bg-primary/10">
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button size="sm" onClick={handeLinkedInClick} className="gap-2 rounded-full gradient-primary shadow-lg hover:shadow-primary/25">
            <Share2 className="h-4 w-4" />
            Post
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setSelectedPhotos([])} className="h-8 w-8 ml-2 rounded-full hover:bg-destructive/10 hover:text-destructive">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default PhotoDiscoveryTab;