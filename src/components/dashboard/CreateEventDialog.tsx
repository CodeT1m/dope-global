import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";

interface CreateEventDialogProps {
  onEventCreated: () => void;
}

const CreateEventDialog = ({ onEventCreated }: CreateEventDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventDate: "",
    location: "",
    organizerName: "",
    organizerLink: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create event
      const { data: event, error: eventError } = await supabase
        .from("events")
        .insert({
          title: formData.title,
          description: formData.description,
          event_date: formData.eventDate,
          location: formData.location,
          organizer_name: formData.organizerName,
          organizer_link: formData.organizerLink,
          photographer_id: user.id,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Generate QR code
      const { error: qrError } = await supabase.functions.invoke('generate-qr', {
        body: { eventId: event.id, eventTitle: event.title }
      });

      if (qrError) {
        console.error('QR generation error:', qrError);
        toast({
          title: "Event created",
          description: "Event created but QR code generation failed. You can regenerate it later.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success!",
          description: "Event created with QR code",
        });
      }

      setOpen(false);
      setFormData({
        title: "",
        description: "",
        eventDate: "",
        location: "",
        organizerName: "",
        organizerLink: "",
      });
      onEventCreated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gradient-primary shadow-glow">
          <Plus className="h-5 w-5 mr-2" />
          Create Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Fill in the details below to create your event gallery
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Summer Music Festival 2025"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventDate">Event Date *</Label>
            <Input
              id="eventDate"
              type="date"
              value={formData.eventDate}
              onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
              placeholder="Kuala Lumpur, Malaysia"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organizerName">Organizer Name</Label>
            <Input
              id="organizerName"
              value={formData.organizerName}
              onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })}
              placeholder="AI Tinkerers KL"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organizerLink">Organizer Link</Label>
            <Input
              id="organizerLink"
              type="url"
              value={formData.organizerLink}
              onChange={(e) => setFormData({ ...formData, organizerLink: e.target.value })}
              placeholder="https://example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell attendees about your event..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gradient-primary">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventDialog;