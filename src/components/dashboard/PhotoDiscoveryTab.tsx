import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Camera, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const PhotoDiscoveryTab = () => {
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageData = canvasRef.current.toDataURL("image/jpeg");
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

  const searchPhotos = async () => {
    if (!capturedImage) {
      toast({
        title: "No Image",
        description: "Please capture or upload a photo first",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('match-face', {
        body: { image: capturedImage }
      });

      if (error) throw error;

      const matches = data?.matches || [];
      
      toast({
        title: "Search Complete",
        description: `Found ${matches.length} photo(s) with matching faces!`,
      });
      
      console.log('Matched photos:', matches);
      
    } catch (error) {
      console.error('Error searching photos:', error);
      toast({
        title: "Search Failed",
        description: error.message || "An error occurred during face matching",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const resetCapture = () => {
    setCapturedImage(null);
    setSearching(false);
  };

  return (
    <div className="space-y-6">
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
              <div className="relative rounded-lg overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full max-w-md mx-auto"
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
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Preview */}
            <div className="flex justify-center">
              <img
                src={capturedImage}
                alt="Captured"
                className="max-w-md w-full rounded-lg border-2 border-primary"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <Button
                onClick={searchPhotos}
                disabled={searching}
                className="gradient-primary"
                size="lg"
              >
                {searching ? (
                  <>Searching with AI...</>
                ) : (
                  <>Find My Photos</>
                )}
              </Button>
              <Button
                onClick={resetCapture}
                variant="outline"
                size="lg"
                disabled={searching}
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Memory Lane - Results will show here */}
      <Card className="p-6 bg-muted/50">
        <h3 className="font-bold text-xl mb-4">
          <span className="text-gradient">Memory Lane</span>
        </h3>
        <p className="text-sm text-muted-foreground text-center py-8">
          Your matching photos will appear here after you upload your photo and search
        </p>
      </Card>
    </div>
  );
};

export default PhotoDiscoveryTab;