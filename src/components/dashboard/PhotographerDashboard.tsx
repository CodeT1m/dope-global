import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Camera, LogOut, Calendar, BarChart3, AlertCircle, UserCircle, Heart, Users as UsersIcon, CreditCard } from "lucide-react";
import logoDark from "@/assets/DOPE_lightfont.svg";
import logoLight from "@/assets/DOPE_darkfont.svg";
import { useTheme } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import CreateEventDialog from "./CreateEventDialog";
import EventsListTab from "./EventsListTab";
import RemoveRequestsTab from "./RemoveRequestsTab";
import AnalyticsTab from "./AnalyticsTab";
import ProfileTab from "./ProfileTab";
import SubscriptionTab from "./SubscriptionTab";

interface PhotographerDashboardProps {
  user: User;
}

const PhotographerDashboard = ({ user }: PhotographerDashboardProps) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const currentTheme = theme === "system" ? systemTheme : theme;
  const logo = currentTheme === "dark" ? logoDark : logoLight;
  const [activeTab, setActiveTab] = useState("events");
  const [stats, setStats] = useState({
    events: 0,
    photos: 0,
    reactions: 0,
    followers: 0,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [profile, setProfile] = useState<any>(null);

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
      .from("images")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", user.id);

    const { data: photos } = await supabase
      .from("images")
      .select("id")
      .eq("user_id", user.id);

    const photoIds = photos?.map(p => p.id) || [];
    let reactionsCount = 0;

    if (photoIds.length > 0) {
      const { count } = await supabase
        .from("photo_reactions")
        .select("*", { count: 'exact', head: true })
        .in("photo_id", photoIds);
      reactionsCount = count || 0;
    }

    const { count: followersCount } = await supabase
      .from("photographer_followers")
      .select("*", { count: 'exact', head: true })
      .eq("photographer_id", user.id);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    setProfile(profileData);

    setStats({
      events: eventsCount || 0,
      photos: photosCount || 0,
      reactions: reactionsCount,
      followers: followersCount || 0,
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
            <img src={logo} alt="DOPE" className="h-24 w-auto" />
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              <span className="font-semibold">Photographer Studio</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="text-primary">{profile?.full_name || 'Your'} Studio</span>
            </h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <CreateEventDialog onEventCreated={handleEventCreated} />
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="gradient-card p-6 rounded-xl shadow-elevated">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
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
                <Heart className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Reactions</p>
                <p className="text-2xl font-bold">{stats.reactions}</p>
              </div>
            </div>
          </div>

          <div className="gradient-card p-6 rounded-xl shadow-elevated">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 gradient-accent rounded-lg flex items-center justify-center">
                <UsersIcon className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Followers</p>
                <p className="text-2xl font-bold">{stats.followers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-4xl grid-cols-5 mb-8">
            <TabsTrigger value="events">
              <Calendar className="h-4 w-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger value="requests">
              <AlertCircle className="h-4 w-4 mr-2" />
              Removal Requests
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="subscription">
              <CreditCard className="h-4 w-4 mr-2" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="profile">
              <UserCircle className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events">
            <EventsListTab key={refreshKey} />
          </TabsContent>

          <TabsContent value="requests">
            <RemoveRequestsTab />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>

          <TabsContent value="subscription">
            <SubscriptionTab />
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
