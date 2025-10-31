import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Camera, Plus, Image, BarChart, LogOut } from "lucide-react";
import dopeLogo from "@/assets/dope-logo.png";

interface PhotographerDashboardProps {
  user: User;
}

const PhotographerDashboard = ({ user }: PhotographerDashboardProps) => {
  const navigate = useNavigate();

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
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-gradient">Your Studio</span>
          </h1>
          <p className="text-muted-foreground">
            {user.email}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="gradient-card p-6 rounded-xl shadow-elevated">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
                <Camera className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Events</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </div>

          <div className="gradient-card p-6 rounded-xl shadow-elevated">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 gradient-accent rounded-lg flex items-center justify-center">
                <Image className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Photos</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </div>

          <div className="gradient-card p-6 rounded-xl shadow-elevated">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
                <BarChart className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Create Event CTA */}
        <div className="gradient-card p-12 rounded-xl shadow-elevated text-center mb-8">
          <Camera className="h-16 w-16 mx-auto mb-6 text-primary animate-float" />
          <h2 className="text-3xl font-bold mb-4">
            <span className="text-gradient">Create Your First Event</span>
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Start building your photography community by creating an event gallery. 
            Upload photos, engage your audience, and let AI help attendees find themselves.
          </p>
          <Button size="lg" className="gradient-primary shadow-glow">
            <Plus className="h-5 w-5 mr-2" />
            Create Event
          </Button>
        </div>

        {/* Coming Soon */}
        <div className="text-center gradient-card p-8 rounded-xl">
          <h3 className="text-xl font-bold mb-2 text-gradient">
            Full Features Coming Soon
          </h3>
          <p className="text-muted-foreground">
            Event management, photo uploads, meme approvals, and analytics dashboard
          </p>
        </div>
      </main>
    </div>
  );
};

export default PhotographerDashboard;
