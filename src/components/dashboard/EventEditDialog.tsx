import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  organizer_name: string;
  organizer_link: string;
}

interface EventEditDialogProps {
  event: Event;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EventEditDialog = ({ event, open, onOpenChange, onSuccess }: EventEditDialogProps) => {
  const [formData, setFormData] = useState({
    title: event.title,
    description: event.description || "",
    event_date: event.event_date,
    location: event.location || "",
    organizer_name: event.organizer_name || "",
    organizer_link: event.organizer_link || "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("events")
        .update(formData)
        .eq("id", event.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Event updated successfully",
      });
      onSuccess();
      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="event_date">Event Date *</Label>
            <Input
              id="event_date"
              type="date"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="City, Country"
            />
          </div>

          <div>
            <Label htmlFor="organizer_name">Organizer Name</Label>
            <Input
              id="organizer_name"
              value={formData.organizer_name}
              onChange={(e) => setFormData({ ...formData, organizer_name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="organizer_link">Organizer Link</Label>
            <Input
              id="organizer_link"
              type="url"
              value={formData.organizer_link}
              onChange={(e) => setFormData({ ...formData, organizer_link: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventEditDialog;
