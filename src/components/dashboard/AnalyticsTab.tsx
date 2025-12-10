import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Camera, Image, Heart, Users, TrendingUp } from "lucide-react";

interface Stats {
  totalEvents: number;
  totalPhotos: number;
  totalReactions: number;
}

const AnalyticsTab = () => {
  const [stats, setStats] = useState<Stats>({
    totalEvents: 0,
    totalPhotos: 0,
    totalReactions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch events count
      const { count: eventsCount } = await supabase
        .from("events")
        .select("*", { count: 'exact', head: true })
        .eq("photographer_id", user.id);

      // Fetch photos count
      const { count: photosCount } = await supabase
        .from("images")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id);

      // Get event IDs
      const { data: events } = await supabase
        .from("events")
        .select("id")
        .eq("photographer_id", user.id);

      const eventIds = events?.map(e => e.id) || [];

      // Fetch reactions count for photographer's photos
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


      setStats({
        totalEvents: eventsCount || 0,
        totalPhotos: photosCount || 0,
        totalReactions: reactionsCount,
      });
      setLoading(false);
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  const statCards = [
    {
      title: "Total Events",
      value: stats.totalEvents,
      icon: Camera,
      color: "gradient-primary",
    },
    {
      title: "Total Photos",
      value: stats.totalPhotos,
      icon: Image,
      color: "gradient-accent",
    },
    {
      title: "Photo Reactions",
      value: stats.totalReactions,
      icon: Heart,
      color: "gradient-primary",
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Engagement Overview</h3>
        <p className="text-muted-foreground">
          Your events have generated <span className="font-bold text-foreground">{stats.totalReactions}</span> reactions
          across <span className="font-bold text-foreground">{stats.totalPhotos}</span> photos.
        </p>
      </Card>
    </div>
  );
};

export default AnalyticsTab;