import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Meme {
  id: string;
  caption: string;
  image_url: string;
  is_approved: boolean;
  created_at: string;
  user_id: string;
  event_id: string;
  events: {
    title: string;
  } | null;
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

const MemesTab = () => {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const { toast } = useToast();

  const fetchMemes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get events created by this photographer
    const { data: events } = await supabase
      .from("events")
      .select("id")
      .eq("photographer_id", user.id);

    if (!events || events.length === 0) {
      setLoading(false);
      return;
    }

    const eventIds = events.map(e => e.id);

    // Fetch memes from these events
    const { data, error } = await supabase
      .from("memes")
      .select(`
        *,
        events!inner (title)
      `)
      .in("event_id", eventIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching memes:", error);
      setLoading(false);
      return;
    }

    // Fetch user profiles separately for each meme
    const memesWithProfiles = await Promise.all(
      (data || []).map(async (meme) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", meme.user_id)
          .maybeSingle();

        return {
          ...meme,
          profiles: profile
        };
      })
    );

    setMemes(memesWithProfiles as any);
    setPendingCount(memesWithProfiles.filter(m => !m.is_approved).length);
    setLoading(false);
  };

  useEffect(() => {
    fetchMemes();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('memes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'memes'
        },
        () => {
          fetchMemes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleApprove = async (memeId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("memes")
      .update({ is_approved: true, approved_by: user.id })
      .eq("id", memeId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Meme approved!" });
      fetchMemes();
    }
  };

  const handleReject = async (memeId: string) => {
    if (!confirm("Are you sure you want to delete this meme?")) return;

    const { error } = await supabase
      .from("memes")
      .delete()
      .eq("id", memeId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Meme rejected and deleted" });
      fetchMemes();
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading memes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Meme Approvals</h2>
        <Badge variant={pendingCount > 0 ? "destructive" : "secondary"} className="text-lg px-4 py-2">
          {pendingCount} Pending
        </Badge>
      </div>

      {memes.length === 0 ? (
        <div className="text-center py-12 gradient-card rounded-xl p-8">
          <p className="text-muted-foreground">No memes submitted yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {memes.map((meme) => (
            <Card key={meme.id} className="p-4">
              <div className="space-y-4">
                <img
                  src={meme.image_url}
                  alt={meme.caption}
                  className="w-full h-64 object-cover rounded-lg"
                />
                <div>
                  <p className="font-semibold">{meme.caption}</p>
                  <p className="text-sm text-muted-foreground">
                    By {meme.profiles?.full_name || meme.profiles?.email || 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Event: {meme.events?.title || 'Unknown Event'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {meme.is_approved ? (
                    <Badge variant="default" className="w-full justify-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approved
                    </Badge>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(meme.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleReject(meme.id)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemesTab;