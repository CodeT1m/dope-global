-- Create event_attendees table to track user attendance
CREATE TABLE public.event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  attended_at timestamp with time zone DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

-- Policies for event_attendees
CREATE POLICY "Users can mark their own attendance"
ON public.event_attendees
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all attendees"
ON public.event_attendees
FOR SELECT
USING (true);

CREATE POLICY "Users can remove their own attendance"
ON public.event_attendees
FOR DELETE
USING (auth.uid() = user_id);