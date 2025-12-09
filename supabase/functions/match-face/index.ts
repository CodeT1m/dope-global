import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json(); // base64 of reference image

    if (!image) {
      throw new Error("No image provided");
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("User not authenticated");

    // Fetch up to 50 recent photos
    const { data: photos, error: photosError } = await supabaseClient
      .from('photos')
      .select('id, file_url')
      .order('created_at', { ascending: false })
      .limit(50);

    if (photosError) throw new Error(`Error fetching photos: ${photosError.message}`);

    console.log(`Fetched ${photos?.length || 0} photos from database`);

    if (!photos || photos.length === 0) {
      return new Response(JSON.stringify({ matches: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process in batches of 10
    const BATCH_SIZE = 10;
    const matchedPhotos: any[] = [];
    const batches = [];

    for (let i = 0; i < photos.length; i += BATCH_SIZE) {
      batches.push(photos.slice(i, i + BATCH_SIZE));
    }

    const referenceImageBase64 = image.includes('base64,') ? image.split(',')[1] : image;

    console.log(`Processing ${batches.length} batches...`);

    for (const batch of batches) {
      try {
        const batchContent: any[] = [
          {
            text: `I will provide a reference photo (the first image) and then ${batch.length} candidate photos labeled with IDs. 
            Identify which of the candidate photos contain the SAME person as the reference photo.
            Focus on facial features. Be precise.
            Return a JSON object with a single key "matchedIds" which is a list of strings containing the IDs of the matching candidate photos.
            If no photos match, return empty list of ids.`
          },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: referenceImageBase64
            }
          }
        ];

        // Add candidate images to prompt
        for (const photo of batch) {
          try {
            const base64 = await fetchImageAsBase64(photo.file_url);
            batchContent.push({
              text: `Candidate Photo ID: ${photo.id}`
            });
            batchContent.push({
              inlineData: {
                mimeType: "image/jpeg",
                data: base64
              }
            });
          } catch (e) {
            console.error(`Failed to load photo ${photo.id}`, e);
          }
        }

        console.log(`Sending batch of ${batch.length} photos to Gemini...`);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: batchContent }],
              generationConfig: {
                responseMimeType: "application/json"
              }
            })
          }
        );

        if (!response.ok) {
          console.error(`Gemini API error: ${response.status} ${response.statusText}`);
          const errorText = await response.text();
          console.error("Error body:", errorText);
          continue;
        }

        const result = await response.json();
        let textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;

        console.log("Gemini Raw Response:", textResponse);

        if (textResponse) {
          // Clean up markdown code blocks if present
          textResponse = textResponse.replace(/```json\n?|\n?```/g, "").trim();

          try {
            const parsed = JSON.parse(textResponse);
            const ids = parsed.matchedIds || [];
            console.log(`Batch matched IDs: ${ids.join(', ')}`);
            const matches = batch.filter(p => ids.includes(p.id));
            matchedPhotos.push(...matches);
          } catch (e) {
            console.error("Failed to parse Gemini response:", textResponse, e);
          }
        }

      } catch (error) {
        console.error("Error processing batch:", error);
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
