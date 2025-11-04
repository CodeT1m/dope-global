-- Add hashtags to events table
ALTER TABLE public.events
ADD COLUMN hashtags text[] DEFAULT '{}';

-- Create photographer_reviews table
CREATE TABLE public.photographer_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photographer_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.photographer_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
  ON public.photographer_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews"
  ON public.photographer_reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own reviews"
  ON public.photographer_reviews FOR UPDATE
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.photographer_reviews FOR DELETE
  USING (auth.uid() = reviewer_id);

-- Create photographer_followers table
CREATE TABLE public.photographer_followers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photographer_id uuid NOT NULL,
  follower_id uuid NOT NULL,
  followed_at timestamp with time zone DEFAULT now(),
  UNIQUE(photographer_id, follower_id)
);

ALTER TABLE public.photographer_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Followers are viewable by everyone"
  ON public.photographer_followers FOR SELECT
  USING (true);

CREATE POLICY "Users can follow photographers"
  ON public.photographer_followers FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow photographers"
  ON public.photographer_followers FOR DELETE
  USING (auth.uid() = follower_id);

-- Create photo_stars table (for user likes)
CREATE TABLE public.photo_stars (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id uuid NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  starred_at timestamp with time zone DEFAULT now(),
  UNIQUE(photo_id, user_id)
);

ALTER TABLE public.photo_stars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stars are viewable by everyone"
  ON public.photo_stars FOR SELECT
  USING (true);

CREATE POLICY "Users can star photos"
  ON public.photo_stars FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unstar photos"
  ON public.photo_stars FOR DELETE
  USING (auth.uid() = user_id);

-- Create photo_removal_requests table
CREATE TABLE public.photo_removal_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id uuid NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  reviewed_by uuid,
  reviewed_at timestamp with time zone
);

ALTER TABLE public.photo_removal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own removal requests"
  ON public.photo_removal_requests FOR SELECT
  USING (auth.uid() = requester_id OR is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can create removal requests"
  ON public.photo_removal_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Photographers can update removal requests for their photos"
  ON public.photo_removal_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.photos
      WHERE photos.id = photo_removal_requests.photo_id
      AND photos.photographer_id = auth.uid()
    ) OR is_admin_or_superadmin(auth.uid())
  );

-- Add trigger for updated_at
CREATE TRIGGER update_photographer_reviews_updated_at
  BEFORE UPDATE ON public.photographer_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_photo_removal_requests_updated_at
  BEFORE UPDATE ON public.photo_removal_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();