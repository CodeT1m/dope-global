import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Search, Star, Image, Trophy, LogOut, Users } from "lucide-react";
import dopeLogo from "@/assets/dope-logo.png";
import SocialTab from "./SocialTab";

interface UserDashboardProps {
  user: User;
}

const UserDashboard = ({ user }: UserDashboardProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("photos");

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
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="photos">
              <Image className="h-4 w-4 mr-2" />
              My Photos
            </TabsTrigger>
            <TabsTrigger value="social">
              <Users className="h-4 w-4 mr-2" />
              Social
            </TabsTrigger>
          </TabsList>

          <TabsContent value="photos" className="space-y-8">
            {/* Stats Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="gradient-card p-6 rounded-xl shadow-elevated">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
                    <Image className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">My Photos</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                </div>
              </div>

              <div className="gradient-card p-6 rounded-xl shadow-elevated">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 gradient-accent rounded-lg flex items-center justify-center">
                    <Star className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Starred</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                </div>
              </div>

              <div className="gradient-card p-6 rounded-xl shadow-elevated">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Badges</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Photo Discovery CTA */}
            <div className="gradient-card p-12 rounded-xl shadow-elevated text-center">
              <Search className="h-16 w-16 mx-auto mb-6 text-primary animate-glow-pulse" />
              <h2 className="text-3xl font-bold mb-4">
                <span className="text-gradient">Find Your Photos with AI</span>
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Upload a selfie and let our AI find all your event photos instantly. 
                No more endless scrolling!
              </p>
              <Button size="lg" className="gradient-primary shadow-glow">
                <Search className="h-5 w-5 mr-2" />
                Start Photo Discovery
              </Button>
            </div>

            {/* Recent Events - Empty State */}
            <div className="gradient-card p-8 rounded-xl">
              <h2 className="text-2xl font-bold mb-6">Recent Events</h2>
              <div className="text-center py-12">
                <Image className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  No events yet. Start discovering your photos at upcoming events!
                </p>
              </div>
            </div>

            {/* Coming Soon */}
            <div className="text-center gradient-card p-8 rounded-xl">
              <h3 className="text-xl font-bold mb-2 text-gradient">
                Full Features Coming Soon
              </h3>
              <p className="text-muted-foreground">
                AI face matching, meme creator, social sharing, and leaderboards
              </p>
            </div>
          </TabsContent>

          <TabsContent value="social">
            <div className="gradient-card p-8 rounded-xl">
              <SocialTab />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default UserDashboard;
