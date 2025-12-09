import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Image, ArrowLeft, Check, X, Download, FileText, Star, AlertCircle, Share2 } from "lucide-react";
import LinkedInPostPanel from "./LinkedInPostPanel";
import PhotoSlideshow from "./PhotoSlideshow";
import PhotoRemovalDialog from "./PhotoRemovalDialog";
import { useTranslation } from "react-i18next";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  organizer_name: string;
  cover_image_url?: string;
  photo_count?: number;
  attended?: boolean;
}

interface Photo {
  id: string;
  file_url: string;
  thumbnail_url: string;
  caption?: string;
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
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [removalDialogOpen, setRemovalDialogOpen] = useState(false);
  const [removalPhotoId, setRemovalPhotoId] = useState<string | null>(null);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const handleViewPhotos = (event: Event) => {
    setSelectedEvent(event);
    setSelectedPhotos([]);
    fetchEventPhotos(event.id);
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Login Required",
        description: "Please login to perform this action",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const fetchEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: eventsData, error } = await supabase
        .from("events")
        .select("*, photos(id, file_url)")
        .eq("is_active", true)
        .order("event_date", { ascending: false });

      if (error) throw error;

      const eventsWithDetails = await Promise.all(
        (eventsData || []).map(async (event: any) => {
          const photos = event.photos || [];
          const photoCount = photos.length;
          const coverPhoto = photos.length > 0 ? photos[0] : null;

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
            cover_image_url: coverPhoto?.file_url,
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
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching photos:", error);
      return;
    }

    const photoIds = data?.map(p => p.id) || [];
    const { data: starData } = await supabase
      .from("photo_stars")
      .select("photo_id, user_id")
      .in("photo_id", photoIds);

    const photosWithStars = data?.map(photo => {
      const photoStars = starData?.filter(s => s.photo_id === photo.id) || [];
      return {
        ...photo,
        is_starred: user ? photoStars.some(s => s.user_id === user.id) : false,
        stars_count: photoStars.length,
      };
    }) || [];

    setEventPhotos(photosWithStars);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    const eventId = searchParams.get("event");

    if (eventId && events.length > 0) {
      const event = events.find(e => e.id === eventId);
      if (event) {
        handleViewPhotos(event);
      }
    }
  }, [events, searchParams]);

  useEffect(() => {
    if (searchCity.trim() === "") {
      setFilteredEvents(events);
    } else {
      const query = searchCity.toLowerCase();
      setFilteredEvents(
        events.filter((event) =>
          event.location?.toLowerCase().includes(query) ||
          event.title?.toLowerCase().includes(query) ||
          event.organizer_name?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchCity, events]);

  const handleShareEvent = (event: Event | null = selectedEvent) => {
    if (!event) return;

    const url = `${window.location.origin}/#/dashboard?event=${event.id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied!",
      description: "Share this link for others to view event photos.",
    });
  };

  const handleToggleAttendance = async (eventId: string, currentlyAttended: boolean) => {
    if (!await checkAuth()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

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

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(url, '_blank');
    }
  };

  const handleDownloadSelected = async () => {
    if (!await checkAuth()) return;
    if (selectedPhotos.length === 0) {
      toast({
        title: "No photos selected",
        description: "Please select at least one photo to download",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Starting Download",
      description: `Preparing ${selectedPhotos.length} photo(s) for download...`,
    });

    for (const photoId of selectedPhotos) {
      const photo = eventPhotos.find(p => p.id === photoId);
      if (photo) {
        await downloadImage(photo.file_url, `photo-${photo.id}.jpg`);
      }
    }
  };

  const handleDownloadAll = async () => {
    if (!await checkAuth()) return;
    if (eventPhotos.length === 0) return;

    toast({
      title: "Starting Download",
      description: `Preparing ${eventPhotos.length} photo(s) for download...`,
    });

    for (const photo of eventPhotos) {
      await downloadImage(photo.file_url, `photo-${photo.id}.jpg`);
    }
  };

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    );
  };

  const toggleStar = async (photoId: string) => {
    if (!await checkAuth()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const photo = eventPhotos.find(p => p.id === photoId) as any;
    if (!photo) return;

    if (photo.is_starred) {
      await supabase
        .from("photo_stars")
        .delete()
        .eq("photo_id", photoId)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("photo_stars")
        .insert({ photo_id: photoId, user_id: user.id });
    }

    if (selectedEvent) {
      fetchEventPhotos(selectedEvent.id);
    }
  };

  const handlePhotoClick = (index: number) => {
    setSlideshowIndex(index);
    setSlideshowOpen(true);
  };

  const handleRemovalRequest = (photoId: string) => {
    setRemovalPhotoId(photoId);
    setRemovalDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {linkedInPanelOpen && selectedEvent && (
        <LinkedInPostPanel
          open={linkedInPanelOpen}
          onOpenChange={setLinkedInPanelOpen}
          eventTitle={selectedEvent.title}
          selectedPhotos={selectedPhotos}
          photos={eventPhotos}
        />
      )}

      <PhotoSlideshow
        photos={eventPhotos.map(p => ({ id: p.id, file_url: p.file_url, caption: p.caption }))}
        currentIndex={slideshowIndex}
        open={slideshowOpen}
        onOpenChange={setSlideshowOpen}
        onIndexChange={setSlideshowIndex}
      />

      {removalPhotoId && (
        <PhotoRemovalDialog
          photoId={removalPhotoId}
          open={removalDialogOpen}
          onOpenChange={setRemovalDialogOpen}
        />
      )}

      {loading ? (
        <div className="text-center py-12">{t('loading_events')}</div>
      ) : selectedEvent ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedEvent(null);
                  setEventPhotos([]);
                  setSelectedPhotos([]);
                  window.history.pushState({}, '', window.location.pathname);
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('back_to_events')}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShareEvent(selectedEvent)}
                className="border-primary/50 hover:bg-primary/10"
              >
                <Share2 className="h-4 w-4 mr-2" />
                {t('share_this_event')}
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {/* Buttons moved to floating bar */}
            </div>
          </div>

          {/* Event Details */}
          <Card className="p-6">
            <h2 className="text-3xl font-bold mb-4">{selectedEvent.title}</h2>
            {selectedEvent.description && (
              <div className="text-muted-foreground mb-6 space-y-2">
                {selectedEvent.description.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s/).map((sentence, i) => {
                  const trimmed = sentence.trim();
                  if (!trimmed) return null;
                  if (trimmed.endsWith(':')) {
                    return <p key={i} className="font-medium mt-4 mb-2 text-foreground">{trimmed}</p>;
                  }
                  return <p key={i} className="leading-relaxed">{trimmed}</p>;
                })}
              </div>
            )}
            <div className="flex flex-wrap gap-4 text-sm mt-4">
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
                {eventPhotos.length} {t('photos')}
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
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-24">
              {eventPhotos.map((photo, index) => (
                <div key={photo.id} className="relative group">
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={selectedPhotos.includes(photo.id)}
                      onCheckedChange={() => togglePhotoSelection(photo.id)}
                      className="bg-background shadow-lg w-6 h-6 border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </div>
                  <div className="absolute top-2 right-2 z-10 flex gap-2">
                    <Button
                      size="icon"
                      variant={(photo as any).is_starred ? "default" : "secondary"}
                      className="h-8 w-8 shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(photo.id);
                      }}
                    >
                      <Star className={`h-4 w-4 ${(photo as any).is_starred ? "fill-current" : ""}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shadow-lg hover:bg-muted/80"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovalRequest(photo.id);
                      }}
                    >
                      <AlertCircle className="h-4 w-4 text-muted-foreground/60" />
                    </Button>
                  </div>
                  <img
                    src={photo.file_url}
                    alt="Event photo"
                    className="w-full aspect-square object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
                    onClick={() => handlePhotoClick(index)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Floating Action Bar */}
          {eventPhotos.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background/95 backdrop-blur-md shadow-2xl border rounded-full px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-10 fade-in duration-300 w-max max-w-[90vw] overflow-x-auto">
              <Button onClick={handleDownloadAll} variant="outline" size="sm" className="whitespace-nowrap">
                <Download className="h-4 w-4 mr-2" />
                {t('download_all')} ({eventPhotos.length})
              </Button>

              {selectedPhotos.length > 0 && (
                <>
                  <div className="h-4 w-px bg-border mx-2"></div>
                  <Button onClick={handleDownloadSelected} variant="secondary" size="sm" className="whitespace-nowrap">
                    <Download className="h-4 w-4 mr-2" />
                    {t('download_selected')} ({selectedPhotos.length})
                  </Button>
                  <Button onClick={() => setLinkedInPanelOpen(true)} className="gradient-primary whitespace-nowrap" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    {t('generate_post')}
                  </Button>
                  <Button onClick={() => setSelectedPhotos([])} variant="ghost" size="icon" className="h-8 w-8 ml-2 rounded-full hover:bg-destructive/10 hover:text-destructive" title="Clear Selection">
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Search */}
          <div>
            <Input
              placeholder={t('search_placeholder')}
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
                {searchCity ? "No events found for this location" : t('no_events')}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
                  {event.cover_image_url && (
                    <div className="relative h-32">
                      <img
                        src={event.cover_image_url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        {event.photo_count || 0} {t('photos')}
                      </div>
                    </div>
                  )}
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="text-base font-bold mb-1 line-clamp-1">{event.title}</h3>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    <div className="space-y-1 text-xs mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>{new Date(event.event_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap mt-auto pt-2">
                      <Button
                        variant={event.attended ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggleAttendance(event.id, event.attended || false)}
                      >
                        {event.attended ? <Check className="h-4 w-4 mr-2" /> : <X className="h-4 w-4 mr-2" />}
                        {event.attended ? t('attended') : t('mark_attendance')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPhotos(event)}
                      >
                        <Image className="h-4 w-4 mr-2" />
                        {t('view_photos')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShareEvent(event)}
                        title={t('share')}
                      >
                        <Share2 className="h-4 w-4" />
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
