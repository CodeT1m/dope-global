import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Image, ArrowLeft, Check, X, Download, FileText } from "lucide-react";
import LinkedInPostPanel from "./LinkedInPostPanel";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  organizer_name: string;
  cover_image_url: string;
  photo_count?: number;
  attended?: boolean;
}

interface Photo {
  id: string;
  file_url: string;
  thumbnail_url: string;
}

const UserEventsTab = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchCity, setSearchCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventPhotos, setEventPhotos] = useState<Photo[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [linkedInPanelOpen, setLinkedInPanelOpen] = useState(false);
  const { toast } = useToast();

  const fetchEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: eventsData, error } = await supabase
        .from("events")
        .select("*, photos(count)")
        .eq("is_active", true)
        .order("event_date", { ascending: false });

      if (error) throw error;

      const eventsWithDetails = await Promise.all(
        (eventsData || []).map(async (event: any) => {
          const photoCount = event.photos?.[0]?.count || 0;

          let attended = false;
          if (user) {
            const { data: attendanceData } = await supabase
              .from("event_attendees")
              .select("id")
              .eq("event_id", event.id)
              .eq("user_id", user.id)
              .maybeSingle();
            attended = !!attendanceData;
          }

          return {
            id: event.id,
            title: event.title,
            description: event.description,
            event_date: event.event_date,
            location: event.location,
            organizer_name: event.organizer_name,
            cover_image_url: event.cover_image_url,
            photo_count: photoCount,
            attended,
          };
        })
      );

      setEvents(eventsWithDetails);
      setFilteredEvents(eventsWithDetails);
    } catch (error: any) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEventPhotos = async (eventId: string) => {
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching photos:", error);
    } else {
      setEventPhotos(data || []);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (searchCity.trim() === "") {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(
        events.filter((event) =>
          event.location?.toLowerCase().includes(searchCity.toLowerCase())
        )
      );
    }
  }, [searchCity, events]);

  const handleToggleAttendance = async (eventId: string, currentlyAttended: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in",
        variant: "destructive",
      });
      return;
    }

    try {
      if (currentlyAttended) {
        const { error } = await supabase
          .from("event_attendees")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", user.id);

        if (error) throw error;
        toast({ title: "Attendance removed" });
      } else {
        const { error } = await supabase
          .from("event_attendees")
          .insert({ event_id: eventId, user_id: user.id });

        if (error) throw error;
        toast({ title: "Marked as attended!" });
      }
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleViewPhotos = (event: Event) => {
    setSelectedEvent(event);
    setSelectedPhotos([]);
    fetchEventPhotos(event.id);
  };

  const handleDownloadSelected = async () => {
    if (selectedPhotos.length === 0) {
      toast({
        title: "No photos selected",
        description: "Please select at least one photo to download",
        variant: "destructive",
      });
      return;
    }

    for (const photoId of selectedPhotos) {
      const photo = eventPhotos.find(p => p.id === photoId);
      if (photo) {
        window.open(photo.file_url, '_blank');
      }
    }

    toast({
      title: "Downloading photos",
      description: `Downloading ${selectedPhotos.length} photo(s)`,
    });
  };

  const handleDownloadAll = async () => {
    if (eventPhotos.length === 0) return;

    eventPhotos.forEach(photo => {
      window.open(photo.file_url, '_blank');
    });

    toast({
      title: "Downloading all photos",
      description: `Downloading ${eventPhotos.length} photo(s)`,
    });
  };

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    );
  };

  return (
    <div className="space-y-6">
      {linkedInPanelOpen && selectedEvent && (
        <LinkedInPostPanel
          open={linkedInPanelOpen}
          onOpenChange={setLinkedInPanelOpen}
          eventTitle={selectedEvent.title}
        />
      )}

      {loading ? (
        <div className="text-center py-12">Loading events...</div>
      ) : selectedEvent ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedEvent(null);
                setEventPhotos([]);
                setSelectedPhotos([]);
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleDownloadAll} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
              {selectedPhotos.length > 0 && (
                <>
                  <Button onClick={handleDownloadSelected} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download Selected ({selectedPhotos.length})
                  </Button>
                  <Button onClick={() => setLinkedInPanelOpen(true)} className="gradient-primary">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate LinkedIn Post
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Event Details */}
          <Card className="p-6">
            <h2 className="text-3xl font-bold mb-2">{selectedEvent.title}</h2>
            {selectedEvent.description && (
              <p className="text-muted-foreground mb-4">{selectedEvent.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(selectedEvent.event_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{selectedEvent.location}</span>
              </div>
              <Badge variant="outline">
                <Image className="h-3 w-3 mr-1" />
                {eventPhotos.length} photos
              </Badge>
            </div>
          </Card>

          {/* Photos Grid */}
          {eventPhotos.length === 0 ? (
            <div className="text-center py-12 gradient-card rounded-xl p-8">
              <Image className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No photos available yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {eventPhotos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={selectedPhotos.includes(photo.id)}
                      onCheckedChange={() => togglePhotoSelection(photo.id)}
                      className="bg-background shadow-lg"
                    />
                  </div>
                  <img
                    src={photo.file_url}
                    alt="Event photo"
                    className="w-full aspect-square object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
                    onClick={() => window.open(photo.file_url, '_blank')}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Search */}
          <div>
            <Input
              placeholder="Search by city or location..."
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Events Grid */}
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 gradient-card rounded-xl p-8">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {searchCity ? "No events found for this location" : "No events available"}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {event.cover_image_url && (
                    <div className="relative h-48">
                      <img
                        src={event.cover_image_url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        {event.photo_count || 0} photos
                      </div>
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(event.event_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{event.location}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant={event.attended ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggleAttendance(event.id, event.attended || false)}
                      >
                        {event.attended ? <Check className="h-4 w-4 mr-2" /> : <X className="h-4 w-4 mr-2" />}
                        {event.attended ? "Attended" : "Mark Attendance"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPhotos(event)}
                      >
                        <Image className="h-4 w-4 mr-2" />
                        View Photos
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserEventsTab;
