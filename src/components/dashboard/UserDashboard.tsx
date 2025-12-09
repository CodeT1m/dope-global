import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import UserEventsTab from "./UserEventsTab";
import ProfileTab from "./ProfileTab";
import PhotoDiscoveryTab from "./PhotoDiscoveryTab";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import logoDark from "@/assets/DOPE_lightfont.svg";
import logoLight from "@/assets/DOPE_darkfont.svg";

interface UserDashboardProps {
  user: User | null;
}

const UserDashboard = ({ user }: UserDashboardProps) => {
  const [activeTab, setActiveTab] = useState("events");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  // If guest, default to events tab
  useEffect(() => {
    if (!user) {
      setActiveTab("events");
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignIn = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img
              src={logoLight}
              alt="DOPE Logo"
              className="h-14 w-auto dark:hidden"
            />
            <img
              src={logoDark}
              alt="DOPE Logo"
              className="h-14 w-auto hidden dark:block"
            />
            <span className="font-bold text-xl tracking-tight hidden sm:inline-block">
              {t('diary_of_photographers')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            {user ? (
              <Button onClick={handleSignOut} variant="outline" size="sm">
                {t('sign_out')}
              </Button>
            ) : (
              <Button onClick={handleSignIn} variant="default" size="sm" className="gradient-primary">
                {t('sign_in')}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground">
            {user ? t('welcome') : t('welcome_guest')}
          </h1>
          <p className="text-muted-foreground">
            {user ? user.email : t('view_photos_shared')}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className={`grid w-full max-w-3xl ${user ? 'grid-cols-5' : 'grid-cols-1'}`}>
            {user && (
              <TabsTrigger value="discover">
                {t('discover')}
              </TabsTrigger>
            )}
            <TabsTrigger value="events">
              {t('events')}
            </TabsTrigger>
            {user && (
              <TabsTrigger value="profile">
                {t('profile')}
              </TabsTrigger>
            )}
          </TabsList>

          {user && (
            <TabsContent value="discover">
              <PhotoDiscoveryTab />
            </TabsContent>
          )}

          <TabsContent value="events">
            <UserEventsTab />
          </TabsContent>

          {user && (
            <TabsContent value="profile">
              <ProfileTab userId={user.id} />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default UserDashboard;
