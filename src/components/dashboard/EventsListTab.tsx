import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { deleteFolderFromR2 } from "@/utils/r2storage";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Image, QrCode, Trash2, Edit, ImagePlus, Download, FileText, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EventEditDialog from "./EventEditDialog";
import EventPhotosDialog from "./EventPhotosDialog";
import BlogPostDialog from "./BlogPostDialog";
import { useTranslation } from "react-i18next";

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
  const [blogPostEvent, setBlogPostEvent] = useState<{ id: string; title: string } | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchEvents = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Fetch Events
    const { data: eventsData, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .eq("photographer_id", user.id)
      .order("event_date", { ascending: false });

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      toast({
        title: "Error",
        description: eventsError.message || "Failed to load events",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // 2. Fetch Photos for these events
    const eventIds = eventsData.map(e => e.id);
    console.log("Fetching photos for Event IDs:", eventIds);

    let photosMap: Record<string, any[]> = {};

    if (eventIds.length > 0) {
      const { data: photosData, error: photosError } = await supabase
        .from("images")
        .select("id, public_url, event_id")
        .in("event_id", eventIds)
        .order("created_at", { ascending: false });

      if (photosError) {
        console.error("Error fetching photos:", photosError);
      } else {
        console.log("Fetched Photos Data:", photosData);
        // Group photos by event_id
        photosData?.forEach(photo => {
          if (!photosMap[photo.event_id]) {
            photosMap[photo.event_id] = [];
          }
          photosMap[photo.event_id].push(photo);
        });
      }
    }

    // 3. Merge Data
    const processedEvents = (eventsData || []).map((event: any) => {
      const photos = photosMap[event.id] || [];
      const coverPhoto = photos.length > 0 ? photos[0] : null;

      return {
        ...event,
        cover_image_url: coverPhoto?.public_url,
        photo_count: photos.length,
      };
    });

    console.log("Final Processed Events:", processedEvents);

    setEvents(processedEvents);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleShareEvent = (event: Event) => {
    const url = `${window.location.origin}/#/dashboard?event=${event.id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied!",
      description: "Share this link for others to view event photos.",
    });
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event? This will also delete all associated photos.")) return;

    // Find event to get title for R2 folder deletion
    const eventToDelete = events.find(e => e.id === eventId);

    // Delete from R2 First
    if (eventToDelete) {
      toast({ title: "Deleting photos..." });
      await deleteFolderFromR2(`Events/${eventToDelete.title}`);
    }

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
    return <div className="text-center py-8">{t('loading_events')}</div>;
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12 gradient-card rounded-xl p-8">
        <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-muted-foreground">{t('no_events')}. {t('create_event_start')}</p>
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

      {blogPostEvent && (
        <BlogPostDialog
          eventId={blogPostEvent.id}
          eventTitle={blogPostEvent.title}
          open={!!blogPostEvent}
          onOpenChange={(open) => {
            if (!open) setBlogPostEvent(null);
          }}
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
                    {t('edit')}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setManagingPhotosEvent({ id: event.id, title: event.title })}
                  >
                    <ImagePlus className="h-4 w-4 mr-2" />
                    {t('photos')}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBlogPostEvent({ id: event.id, title: event.title })}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {t('write_blog')}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShareEvent(event)}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    {t('share')}
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(event.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('delete')}
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
                      {t('download_qr')}
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