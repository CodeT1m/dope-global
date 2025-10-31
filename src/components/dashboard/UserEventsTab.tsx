import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Check, Linkedin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  organizer_name: string;
  cover_image_url: string;
  _count?: { photos: number };
  _attended?: boolean;
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
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [eventPhotos, setEventPhotos] = useState<Photo[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: eventsData, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .order("event_date", { ascending: false });

      if (error) throw error;

      if (!eventsData) {
        setEvents([]);
        setFilteredEvents([]);
        setLoading(false);
        return;
      }

      const eventsWithCounts = await Promise.all(
        eventsData.map(async (event) => {
          const { count } = await supabase
            .from("photos")
            .select("*", { count: "exact", head: true })
            .eq("event_id", event.id);

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
            ...event,
            _count: { photos: count || 0 },
            _attended: attended,
          };
        })
      );

      setEvents(eventsWithCounts);
      setFilteredEvents(eventsWithCounts);
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

  const handleViewPhotos = (eventId: string) => {
    setSelectedEvent(eventId);
    setSelectedPhotos([]);
    fetchEventPhotos(eventId);
  };

  const handleGenerateLinkedInPost = () => {
    if (selectedPhotos.length === 0) {
      toast({
        title: "No photos selected",
        description: "Please select at least one photo",
        variant: "destructive",
      });
      return;
    }

    const event = events.find(e => e.id === selectedEvent);
    const postText = `Had an amazing time at ${event?.title}! 🎉 #EventPhotography #Memories`;
    
    toast({
      title: "LinkedIn Post Ready!",
      description: `Selected ${selectedPhotos.length} photo(s). Copy the text and upload photos to LinkedIn manually.`,
    });

    navigator.clipboard.writeText(postText);
  };

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev =>
      prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading events...</div>;
  }

  if (selectedEvent) {
    const event = events.find(e => e.id === selectedEvent);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setSelectedEvent(null)}>
            ← Back to Events
          </Button>
          {selectedPhotos.length > 0 && (
            <Button onClick={handleGenerateLinkedInPost}>
              <Linkedin className="h-4 w-4 mr-2" />
              Generate LinkedIn Post ({selectedPhotos.length})
            </Button>
          )}
        </div>

        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-2">{event?.title}</h2>
          <p className="text-muted-foreground mb-4">{event?.description}</p>
        </Card>

        {eventPhotos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No photos available yet</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {eventPhotos.map((photo) => (
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
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Input
          placeholder="Search by city or location..."
          value={searchCity}
          onChange={(e) => setSearchCity(e.target.value)}
          className="max-w-md"
        />
      </div>

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
            <Card key={event.id} className="overflow-hidden">
              {event.cover_image_url && (
                <img
                  src={event.cover_image_url}
                  alt={event.title}
                  className="w-full h-48 object-cover"
                />
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
                    variant={event._attended ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleAttendance(event.id, event._attended || false)}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {event._attended ? "Attended" : "Mark Attendance"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewPhotos(event.id)}
                  >
                    View Photos ({event._count?.photos || 0})
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserEventsTab;
