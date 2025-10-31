import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventId, eventTitle } = await req.json();
    
    if (!eventId || !eventTitle) {
      return new Response(
        JSON.stringify({ error: 'Event ID and title are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating QR code for event:', eventId);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate QR code using a public API
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
      `${Deno.env.get('SUPABASE_URL')?.replace('https://', 'https://').replace('.supabase.co', '.supabase.co')}/events/${eventId}`
    )}`;

    console.log('Fetching QR code from API...');
    const qrResponse = await fetch(qrApiUrl);
    
    if (!qrResponse.ok) {
      throw new Error('Failed to generate QR code');
    }

    const qrBlob = await qrResponse.blob();
    const qrArrayBuffer = await qrBlob.arrayBuffer();
    
    // Upload to storage
    const fileName = `${eventId}.png`;
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('qr-codes')
      .upload(fileName, qrArrayBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from('qr-codes')
      .getPublicUrl(fileName);

    console.log('QR code generated and uploaded successfully');

    // Update event with QR code URL
    const { error: updateError } = await supabaseClient
      .from('events')
      .update({ qr_code_url: publicUrl })
      .eq('id', eventId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({ qrCodeUrl: publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});