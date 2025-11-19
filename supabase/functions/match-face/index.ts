import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    
    if (!image) {
      throw new Error("No image provided");
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    // Fetch all photos from the database
    const { data: photos, error: photosError } = await supabaseClient
      .from('photos')
      .select('id, file_url, event_id, photographer_id')
      .limit(100);

    if (photosError) {
      throw new Error(`Error fetching photos: ${photosError.message}`);
    }

    if (!photos || photos.length === 0) {
      return new Response(JSON.stringify({ matches: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use Gemini API to find matching faces
    const matchedPhotos = [];
    
    // Process in batches to avoid rate limits
    for (const photo of photos.slice(0, 20)) { // Limit to first 20 for performance
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  {
                    text: "Does this photo contain the same person as the reference image? Respond with only 'YES' or 'NO'."
                  },
                  {
                    inlineData: {
                      mimeType: "image/jpeg",
                      data: image.split(',')[1] // Remove data:image/jpeg;base64, prefix
                    }
                  },
                  {
                    inlineData: {
                      mimeType: "image/jpeg",
                      data: await fetchImageAsBase64(photo.file_url)
                    }
                  }
                ]
              }]
            })
          }
        );

        const result = await response.json();
        const answer = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase();
        
        if (answer === 'YES') {
          matchedPhotos.push(photo);
        }
      } catch (error) {
        console.error(`Error processing photo ${photo.id}:`, error);
      }
    }

    return new Response(JSON.stringify({ matches: matchedPhotos }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in match-face function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  return base64;
}
