import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Image, QrCode, Trash2, Edit, ImagePlus, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EventEditDialog from "./EventEditDialog";
import EventPhotosDialog from "./EventPhotosDialog";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  organizer_name: string;
  organizer_link: string;
  qr_code_url: string;
  created_at: string;
  cover_image_url?: string;
  photo_count?: number;
}

const EventsListTab = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [managingPhotosEvent, setManagingPhotosEvent] = useState<{ id: string; title: string } | null>(null);
  const { toast } = useToast();

  const fetchEvents = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("events")
      .select(`
        *,
        photos(id, file_url)
      `)
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
      // Process events to add cover image and photo count
      const processedEvents = (data || []).map((event: any) => {
        const photos = event.photos || [];
        const randomPhoto = photos.length > 0 ? photos[Math.floor(Math.random() * photos.length)] : null;
        
        return {
          ...event,
          cover_image_url: randomPhoto?.file_url,
          photo_count: photos.length,
          photos: undefined, // Remove photos array from final object
        };
      });
      
      setEvents(processedEvents);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);


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
    <>
      {editingEvent && (
        <EventEditDialog
          event={editingEvent}
          open={!!editingEvent}
          onOpenChange={(open) => !open && setEditingEvent(null)}
          onSuccess={fetchEvents}
        />
      )}

      {managingPhotosEvent && (
        <EventPhotosDialog
          eventId={managingPhotosEvent.id}
          eventTitle={managingPhotosEvent.title}
          open={!!managingPhotosEvent}
          onOpenChange={(open) => !open && setManagingPhotosEvent(null)}
        />
      )}

      <div className="space-y-6">
        {events.map((event) => (
        <Card key={event.id} className="overflow-hidden">
          <div className="grid md:grid-cols-[200px_1fr_200px] gap-6">
            {/* Cover Photo */}
            <div className="md:h-48 h-64 bg-muted relative overflow-hidden">
              {event.cover_image_url ? (
                <img
                  src={event.cover_image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="h-12 w-12 text-muted-foreground/50" />
                </div>
              )}
              {event.photo_count !== undefined && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  {event.photo_count} photo{event.photo_count !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Event Details */}
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
              {event.description && (
                <p className="text-muted-foreground mb-3 line-clamp-2">{event.description}</p>
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
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingEvent(event)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setManagingPhotosEvent({ id: event.id, title: event.title })}
                >
                  <ImagePlus className="h-4 w-4 mr-2" />
                  Photos
                </Button>

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

            {/* QR Code Section */}
            <div className="p-6 bg-muted/30 flex flex-col items-center justify-center">
              {event.qr_code_url ? (
                <>
                  <img
                    src={event.qr_code_url}
                    alt="Event QR Code"
                    className="w-32 h-32 object-contain mb-3"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(event.qr_code_url, '_blank')}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download QR
                  </Button>
                </>
              ) : (
                <div className="text-center text-muted-foreground text-sm">
                  <QrCode className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No QR Code
                </div>
              )}
            </div>
          </div>
        </Card>
        ))}
      </div>
    </>
  );
};

export default EventsListTab;