import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Crown, Users, Camera, Image, LogOut, BarChart3, UserCircle, Globe } from "lucide-react";
import logoDark from "@/assets/logo-dark.png";
import logoLight from "@/assets/logo-light.png";
import { useTheme } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import ProfileTab from "./ProfileTab";
import HomepageManagementTab from "./HomepageManagementTab";
import ManagementTab from "./ManagementTab";

interface SuperadminDashboardProps {
  user: User;
}

const SuperadminDashboard = ({ user }: SuperadminDashboardProps) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const currentTheme = theme === "system" ? systemTheme : theme;
  const logo = currentTheme === "dark" ? logoDark : logoLight;
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalUsers: 0,
    photographers: 0,
    events: 0,
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    // Fetch total users
    const { count: usersCount } = await supabase
      .from("profiles")
      .select("*", { count: 'exact', head: true });

    // Fetch photographers count
    const { count: photographersCount } = await supabase
      .from("user_roles")
      .select("*", { count: 'exact', head: true })
      .eq("role", "admin");

    // Fetch events count
    const { count: eventsCount } = await supabase
      .from("events")
      .select("*", { count: 'exact', head: true });

    setStats({
      totalUsers: usersCount || 0,
      photographers: photographersCount || 0,
      events: eventsCount || 0,
    });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="DOPE" className="h-16 w-auto" />
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-accent" />
              <span className="font-semibold">Superadmin Dashboard</span>
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-primary">Welcome, Superadmin</span>
          </h1>
          <p className="text-muted-foreground">
            {user.email}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full max-w-3xl grid-cols-4">
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="management">
              <Crown className="h-4 w-4 mr-2" />
              Management
            </TabsTrigger>
            <TabsTrigger value="homepage">
              <Globe className="h-4 w-4 mr-2" />
              Homepage
            </TabsTrigger>
            <TabsTrigger value="profile">
              <UserCircle className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* Stats Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="gradient-card p-6 rounded-xl shadow-elevated">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="gradient-card p-6 rounded-xl shadow-elevated">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 gradient-accent rounded-lg flex items-center justify-center">
                    <Camera className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Photographers</p>
                    <p className="text-2xl font-bold">{stats.photographers}</p>
                  </div>
                </div>
              </div>

              <div className="gradient-card p-6 rounded-xl shadow-elevated">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
                    <Image className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Events</p>
                    <p className="text-2xl font-bold">{stats.events}</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="management">
            <ManagementTab />
          </TabsContent>

          <TabsContent value="homepage">
            <HomepageManagementTab />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileTab userId={user.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SuperadminDashboard;
