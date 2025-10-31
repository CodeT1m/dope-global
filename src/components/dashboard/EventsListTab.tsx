import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Image, QrCode, Upload, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  organizer_name: string;
  qr_code_url: string;
  created_at: string;
}

const EventsListTab = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingEventId, setUploadingEventId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEvents = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("photographer_id", user.id)
      .order("event_date", { ascending: false });

    if (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handlePhotoUpload = async (eventId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingEventId(eventId);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${eventId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('event-photos')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('event-photos')
          .getPublicUrl(fileName);

        // Create photo record
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingEventId(null);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Event deleted successfully" });
      fetchEvents();
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading events...</div>;
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12 gradient-card rounded-xl p-8">
        <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-muted-foreground">No events yet. Create your first event to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {events.map((event) => (
        <Card key={event.id} className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Event QR Code */}
            {event.qr_code_url && (
              <div className="md:w-32 md:h-32 w-full">
                <img
                  src={event.qr_code_url}
                  alt="Event QR Code"
                  className="w-full h-full object-contain border border-border rounded-lg"
                />
              </div>
            )}

            {/* Event Details */}
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
              {event.description && (
                <p className="text-muted-foreground mb-3">{event.description}</p>
              )}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(event.event_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{event.location}</span>
                </div>
                {event.organizer_name && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Organizer:</span>
                    <span>{event.organizer_name}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-3">
                <Label htmlFor={`upload-${event.id}`} className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild disabled={uploadingEventId === event.id}>
                    <span>
                      {uploadingEventId === event.id ? (
                        <>Uploading...</>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Photos
                        </>
                      )}
                    </span>
                  </Button>
                </Label>
                <Input
                  id={`upload-${event.id}`}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(event.id, e.target.files)}
                />

                {event.qr_code_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(event.qr_code_url, '_blank')}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    View QR
                  </Button>
                )}

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(event.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default EventsListTab;