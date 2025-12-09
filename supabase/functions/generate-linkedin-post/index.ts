import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { takeaways, tone, includeEmojis, eventTitle, imageUrls } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a LinkedIn post writer. Generate engaging LinkedIn posts based on event experiences.
${includeEmojis ? 'Include relevant emojis throughout the post.' : 'Do not use emojis.'}
Keep the post concise and professional, typically 3-5 paragraphs.`;

    let userContent: any[] = [
      {
        type: "text",
        text: `Write a LinkedIn post about attending "${eventTitle}".

Tone: ${tone}
Key takeaways from the attendee:
${takeaways}

Make it engaging and authentic. ${tone === 'Rant' ? 'Express strong opinions and passion about the experience.' : ''}`
      }
    ];

    if (imageUrls && imageUrls.length > 0) {
      userContent[0].text += `\n\nI have attached ${imageUrls.length} photo(s) from the event. Please incorporate details from these photos into the post if relevant (e.g., describing the atmosphere, people, or setting).`;

      imageUrls.forEach((url: string) => {
        userContent.push({
          type: "image_url",
          image_url: {
            url: url
          }
        });
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-1.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const generatedPost = data.choices[0].message.content;

    return new Response(JSON.stringify({ post: generatedPost }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating LinkedIn post:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
