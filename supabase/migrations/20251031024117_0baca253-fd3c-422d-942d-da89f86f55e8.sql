-- Create storage buckets for event photos and QR codes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('event-photos', 'event-photos', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']),
  ('qr-codes', 'qr-codes', true, 5242880, ARRAY['image/png', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies for event-photos bucket
CREATE POLICY "Anyone can view event photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-photos');

CREATE POLICY "Admins can upload event photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-photos' 
  AND is_admin_or_superadmin(auth.uid())
);

CREATE POLICY "Admins can update their event photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-photos' 
  AND is_admin_or_superadmin(auth.uid())
);

CREATE POLICY "Admins can delete their event photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-photos' 
  AND is_admin_or_superadmin(auth.uid())
);

-- RLS policies for qr-codes bucket
CREATE POLICY "Anyone can view QR codes"
ON storage.objects FOR SELECT
USING (bucket_id = 'qr-codes');

CREATE POLICY "Admins can upload QR codes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'qr-codes' 
  AND is_admin_or_superadmin(auth.uid())
);

CREATE POLICY "Admins can delete QR codes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'qr-codes' 
  AND is_admin_or_superadmin(auth.uid())
);