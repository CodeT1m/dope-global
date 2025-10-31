import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Search, Image, Users, LogOut, UserCircle, Calendar } from "lucide-react";
import dopeLogo from "@/assets/dope-logo.png";
import SocialTab from "./SocialTab";
import ProfileTab from "./ProfileTab";
import PhotoDiscoveryTab from "./PhotoDiscoveryTab";
import EventsBrowseTab from "./EventsBrowseTab";

interface UserDashboardProps {
  user: User;
}

const UserDashboard = ({ user }: UserDashboardProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("discover");

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={dopeLogo} alt="DOPE" className="h-10 w-auto" />
            <span className="font-semibold">My Photos</span>
          </div>
          <Button onClick={handleSignOut} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-gradient">Welcome!</span>
          </h1>
          <p className="text-muted-foreground">
            {user.email}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full max-w-3xl grid-cols-4">
            <TabsTrigger value="discover">
              <Search className="h-4 w-4 mr-2" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="events">
              <Calendar className="h-4 w-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger value="social">
              <Users className="h-4 w-4 mr-2" />
              Social
            </TabsTrigger>
            <TabsTrigger value="profile">
              <UserCircle className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover">
            <PhotoDiscoveryTab />
          </TabsContent>

          <TabsContent value="events">
            <EventsBrowseTab />
          </TabsContent>

          <TabsContent value="social">
            <div className="gradient-card p-8 rounded-xl">
              <SocialTab />
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <ProfileTab userId={user.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default UserDashboard;
