import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RemovalRequest {
  id: string;
  photo_id: string;
  requester_id: string;
  reason: string | null;
  status: string;
  created_at: string;
  photos: {
    file_url: string;
    caption: string | null;
    events: {
      title: string;
    } | null;
  } | null;
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

const RemoveRequestsTab = () => {
  const [requests, setRequests] = useState<RemovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const { toast } = useToast();

  const fetchRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get photos owned by this photographer
    const { data: photos } = await supabase
      .from("photos")
      .select("id")
      .eq("photographer_id", user.id);

    if (!photos || photos.length === 0) {
      setLoading(false);
      return;
    }

    const photoIds = photos.map(p => p.id);

    // Fetch removal requests for these photos
    const { data, error } = await supabase
      .from("photo_removal_requests")
      .select(`
        *,
        photos!inner (
          file_url,
          caption,
          event_id
        )
      `)
      .in("photo_id", photoIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching requests:", error);
      setLoading(false);
      return;
    }

    // Fetch event and profile details separately
    const requestsWithDetails = await Promise.all(
      (data || []).map(async (request) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", request.requester_id)
          .maybeSingle();

        let eventTitle = null;
        if (request.photos?.event_id) {
          const { data: event } = await supabase
            .from("events")
            .select("title")
            .eq("id", request.photos.event_id)
            .maybeSingle();
          eventTitle = event?.title;
        }

        return {
          ...request,
          profiles: profile,
          photos: request.photos ? {
            ...request.photos,
            events: eventTitle ? { title: eventTitle } : null
          } : null
        };
      })
    );

    setRequests(requestsWithDetails as any);
    setPendingCount(requestsWithDetails.filter(r => r.status === 'pending').length);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('removal-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'photo_removal_requests'
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleApprove = async (requestId: string, photoId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Update request status
    const { error: updateError } = await supabase
      .from("photo_removal_requests")
      .update({ 
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq("id", requestId);

    if (updateError) {
      toast({
        title: "Error",
        description: updateError.message,
        variant: "destructive",
      });
      return;
    }

    // Delete the photo
    const { error: deleteError } = await supabase
      .from("photos")
      .delete()
      .eq("id", photoId);

    if (deleteError) {
      toast({
        title: "Error deleting photo",
        description: deleteError.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Photo removed successfully" });
      fetchRequests();
    }
  };

  const handleReject = async (requestId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("photo_removal_requests")
      .update({ 
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq("id", requestId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Request rejected" });
      fetchRequests();
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading removal requests...</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="destructive">Pending</Badge>;
      case 'approved':
        return <Badge variant="default">Approved</Badge>;
      case 'rejected':
        return <Badge variant="secondary">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Photo Removal Requests</h2>
        <Badge variant={pendingCount > 0 ? "destructive" : "secondary"} className="text-lg px-4 py-2">
          {pendingCount} Pending
        </Badge>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12 gradient-card rounded-xl p-8">
          <p className="text-muted-foreground">No removal requests yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {requests.map((request) => (
            <Card key={request.id} className="p-4">
              <div className="space-y-4">
                {request.photos && (
                  <img
                    src={request.photos.file_url}
                    alt={request.photos.caption || "Requested photo"}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                )}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">
                      Requested by: {request.profiles?.full_name || request.profiles?.email || 'Unknown'}
                    </p>
                    {getStatusBadge(request.status)}
                  </div>
                  {request.photos?.events && (
                    <p className="text-xs text-muted-foreground">
                      Event: {request.photos.events.title}
                    </p>
                  )}
                  {request.reason && (
                    <div className="mt-2 p-3 bg-muted rounded-lg">
                      <p className="text-sm flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{request.reason}</span>
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Requested: {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {request.status === 'pending' ? (
                    <>
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(request.id, request.photo_id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve & Remove
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleReject(request.id)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  ) : (
                    <div className="w-full text-center py-2 text-sm text-muted-foreground">
                      {request.status === 'approved' ? 'Photo was removed' : 'Request was rejected'}
                    </div>
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

export default RemoveRequestsTab;
