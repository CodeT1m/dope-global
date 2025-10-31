-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin', 'user');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  instagram_handle TEXT,
  linkedin_url TEXT,
  behance_url TEXT,
  x_handle TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create events table (managed by photographers/admins)
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  location TEXT,
  organizer_name TEXT,
  organizer_link TEXT,
  cover_image_url TEXT,
  qr_code_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create photos table
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  photographer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  reactions_fire INT DEFAULT 0,
  reactions_laugh INT DEFAULT 0,
  reactions_clap INT DEFAULT 0,
  stars_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create photo_reactions table
CREATE TABLE public.photo_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT CHECK (reaction_type IN ('fire', 'laugh', 'clap', 'star')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(photo_id, user_id, reaction_type)
);

-- Create memes table
CREATE TABLE public.memes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  caption TEXT NOT NULL,
  image_url TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id),
  likes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_badges table
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to check if user is superadmin or admin
CREATE OR REPLACE FUNCTION public.is_admin_or_superadmin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('superadmin', 'admin')
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'superadmin'));

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for events
CREATE POLICY "Events are viewable by everyone"
  ON public.events FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can create events"
  ON public.events FOR INSERT
  WITH CHECK (public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Photographers can update their own events"
  ON public.events FOR UPDATE
  USING (photographer_id = auth.uid() OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Photographers can delete their own events"
  ON public.events FOR DELETE
  USING (photographer_id = auth.uid() OR public.has_role(auth.uid(), 'superadmin'));

-- RLS Policies for photos
CREATE POLICY "Photos are viewable by everyone"
  ON public.photos FOR SELECT
  USING (TRUE);

CREATE POLICY "Photographers can upload photos to their events"
  ON public.photos FOR INSERT
  WITH CHECK (
    public.is_admin_or_superadmin(auth.uid()) AND
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND photographer_id = auth.uid())
  );

CREATE POLICY "Photographers can update their own photos"
  ON public.photos FOR UPDATE
  USING (photographer_id = auth.uid() OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Photographers can delete their own photos"
  ON public.photos FOR DELETE
  USING (photographer_id = auth.uid() OR public.has_role(auth.uid(), 'superadmin'));

-- RLS Policies for photo_reactions
CREATE POLICY "Reactions are viewable by everyone"
  ON public.photo_reactions FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users can add reactions"
  ON public.photo_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON public.photo_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for memes
CREATE POLICY "Approved memes are viewable by everyone"
  ON public.memes FOR SELECT
  USING (is_approved = TRUE OR user_id = auth.uid() OR public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Authenticated users can create memes"
  ON public.memes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can approve memes"
  ON public.memes FOR UPDATE
  USING (public.is_admin_or_superadmin(auth.uid()));

-- RLS Policies for user_badges
CREATE POLICY "Badges are viewable by everyone"
  ON public.user_badges FOR SELECT
  USING (TRUE);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert superadmin role for solomontimkid@gmail.com (will be added after first login)
-- This will need to be done manually or via a script after the user signs up