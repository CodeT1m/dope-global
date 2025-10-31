import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Calendar, Image as ImageIcon, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface EventWithPhotos {
  id: string;
  title: string;
  location: string | null;
  event_date: string;
  photo_count: number;
}

const SocialTab = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userEvents, setUserEvents] = useState<EventWithPhotos[]>([]);
  const [locationFilter, setLocationFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserEvents = async (userId: string) => {
    setEventsLoading(true);
    try {
      // Get all events that have photos starred by this user
      const { data: starredPhotos, error: photosError } = await supabase
        .from('photos')
        .select('event_id, events(id, title, location, event_date)')
        .eq('stars_count', 1); // This would need a proper stars table in production

      if (photosError) throw photosError;

      // Count photos per event
      const eventMap = new Map<string, EventWithPhotos>();
      
      // For now, just show all events with photos as a placeholder
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, title, location, event_date, photos(count)')
        .gt('photos.count', 0);

      if (eventsError) throw eventsError;

      const formattedEvents: EventWithPhotos[] = (events || []).map(event => ({
        id: event.id,
        title: event.title,
        location: event.location,
        event_date: event.event_date,
        photo_count: 0, // Would be calculated from user's starred photos
      }));

      setUserEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching user events:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleUserClick = (user: UserProfile) => {
    setSelectedUser(user);
    fetchUserEvents(user.id);
  };

  const filteredUsers = users.filter(user => 
    !locationFilter || user.email.toLowerCase().includes(locationFilter.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by location or email..."
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Users List */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Community Members</h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredUsers.map((user) => (
              <Card
                key={user.id}
                onClick={() => handleUserClick(user)}
                className={`p-4 cursor-pointer transition-all hover:shadow-glow ${
                  selectedUser?.id === user.id ? 'shadow-glow border-primary' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                    {user.full_name?.[0] || user.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{user.full_name || 'Anonymous'}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </Card>
            ))}
            {filteredUsers.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No users found
              </p>
            )}
          </div>
        </div>

        {/* Selected User's Events */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold">
            {selectedUser ? `${selectedUser.full_name || selectedUser.email}'s Events` : 'Select a User'}
          </h3>
          {selectedUser && (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {eventsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : userEvents.length > 0 ? (
                userEvents.map((event) => (
                  <Card key={event.id} className="p-4 hover:shadow-glow transition-all">
                    <h4 className="font-semibold mb-2">{event.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(event.event_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        {event.photo_count} photos
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No events found for this user
                </p>
              )}
            </div>
          )}
          {!selectedUser && (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Select a community member to view their events and photos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocialTab;