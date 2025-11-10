-- Create photographer_communities table for recurring community selections
CREATE TABLE public.photographer_communities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photographer_id UUID NOT NULL,
  community_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.photographer_communities ENABLE ROW LEVEL SECURITY;

-- Photographers can view their own communities
CREATE POLICY "Photographers can view their own communities"
ON public.photographer_communities
FOR SELECT
USING (auth.uid() = photographer_id);

-- Photographers can create their own communities
CREATE POLICY "Photographers can create their own communities"
ON public.photographer_communities
FOR INSERT
WITH CHECK (auth.uid() = photographer_id);

-- Photographers can delete their own communities
CREATE POLICY "Photographers can delete their own communities"
ON public.photographer_communities
FOR DELETE
USING (auth.uid() = photographer_id);

-- Create homepage_sections table for superadmin to manage homepage logos
CREATE TABLE public.homepage_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_name TEXT NOT NULL, -- 'resources' or 'community'
  logo_url TEXT NOT NULL,
  link_url TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  use_background BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

-- Everyone can view active homepage sections
CREATE POLICY "Homepage sections are viewable by everyone"
ON public.homepage_sections
FOR SELECT
USING (is_active = true);

-- Superadmins can manage homepage sections
CREATE POLICY "Superadmins can manage homepage sections"
ON public.homepage_sections
FOR ALL
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_homepage_sections_updated_at
BEFORE UPDATE ON public.homepage_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();