import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Camera, LogOut, Calendar, BarChart3, Sparkles, UserCircle } from "lucide-react";
import dopeLogo from "@/assets/dope-logo.png";
import CreateEventDialog from "./CreateEventDialog";
import EventsListTab from "./EventsListTab";
import MemesTab from "./MemesTab";
import AnalyticsTab from "./AnalyticsTab";
import ProfileTab from "./ProfileTab";

interface PhotographerDashboardProps {
  user: User;
}

const PhotographerDashboard = ({ user }: PhotographerDashboardProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("events");
  const [stats, setStats] = useState({
    events: 0,
    photos: 0,
    reactions: 0,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const fetchStats = async () => {
    const { count: eventsCount } = await supabase
      .from("events")
      .select("*", { count: 'exact', head: true })
      .eq("photographer_id", user.id);

    const { count: photosCount } = await supabase
      .from("photos")
      .select("*", { count: 'exact', head: true })
      .eq("photographer_id", user.id);

    const { data: photos } = await supabase
      .from("photos")
      .select("id")
      .eq("photographer_id", user.id);

    const photoIds = photos?.map(p => p.id) || [];
    let reactionsCount = 0;

    if (photoIds.length > 0) {
      const { count } = await supabase
        .from("photo_reactions")
        .select("*", { count: 'exact', head: true })
        .in("photo_id", photoIds);
      reactionsCount = count || 0;
    }

    setStats({
      events: eventsCount || 0,
      photos: photosCount || 0,
      reactions: reactionsCount,
    });
  };

  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  const handleEventCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={dopeLogo} alt="DOPE" className="h-10 w-auto" />
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              <span className="font-semibold">Photographer Studio</span>
            </div>
          </div>
          <Button onClick={handleSignOut} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="text-gradient">Your Studio</span>
            </h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <CreateEventDialog onEventCreated={handleEventCreated} />
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="gradient-card p-6 rounded-xl shadow-elevated">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Events</p>
                <p className="text-2xl font-bold">{stats.events}</p>
              </div>
            </div>
          </div>

          <div className="gradient-card p-6 rounded-xl shadow-elevated">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 gradient-accent rounded-lg flex items-center justify-center">
                <Camera className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Photos</p>
                <p className="text-2xl font-bold">{stats.photos}</p>
              </div>
            </div>
          </div>

          <div className="gradient-card p-6 rounded-xl shadow-elevated">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Reactions</p>
                <p className="text-2xl font-bold">{stats.reactions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-3xl grid-cols-4 mb-8">
            <TabsTrigger value="events">
              <Calendar className="h-4 w-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger value="memes">
              <Sparkles className="h-4 w-4 mr-2" />
              Memes
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="profile">
              <UserCircle className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events">
            <EventsListTab key={refreshKey} />
          </TabsContent>

          <TabsContent value="memes">
            <MemesTab />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileTab userId={user.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PhotographerDashboard;
