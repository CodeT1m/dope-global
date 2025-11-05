-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  photographer_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  cover_photo_id uuid REFERENCES public.photos(id) ON DELETE SET NULL,
  category text,
  hashtags text[] DEFAULT '{}',
  tag_timi boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Blog posts are viewable by everyone"
  ON public.blog_posts
  FOR SELECT
  USING (true);

CREATE POLICY "Photographers can create blog posts"
  ON public.blog_posts
  FOR INSERT
  WITH CHECK (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Photographers can update their own blog posts"
  ON public.blog_posts
  FOR UPDATE
  USING (photographer_id = auth.uid() OR has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Photographers can delete their own blog posts"
  ON public.blog_posts
  FOR DELETE
  USING (photographer_id = auth.uid() OR has_role(auth.uid(), 'superadmin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();