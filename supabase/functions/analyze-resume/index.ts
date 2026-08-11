import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { resumeText } = await req.json();

    if (!resumeText) {
      return new Response(JSON.stringify({ error: "No resume text provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY secret is missing. Add it in Supabase → Edge Functions → Secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const MODEL = "gemini-2.5-flash";
    let actualText = resumeText;

    // ── PDF handling ──────────────────────────────────────────
    if (resumeText.startsWith("[PDF_BASE64]")) {
      const base64Data = resumeText.slice("[PDF_BASE64]".length);

      const extractResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: "Extract all text from this PDF resume. Return only plain text, no commentary." },
                { inline_data: { mime_type: "application/pdf", data: base64Data } },
              ],
            }],
            generationConfig: { temperature: 0, maxOutputTokens: 4096 },
          }),
        }
      );

      if (!extractResponse.ok) {
        const errText = await extractResponse.text();
        console.error("PDF extract error:", extractResponse.status, errText.slice(0, 300));
        return new Response(
          JSON.stringify({ error: "Failed to read PDF. Please upload your resume as a .txt file." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const extractData = await extractResponse.json();
      actualText = extractData.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (actualText.trim().length < 50) {
        return new Response(
          JSON.stringify({ error: "Could not read enough text from PDF. Please upload as .txt file." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── Trim resume text to avoid hitting input token limits ──
    // 6000 chars is ~1500 tokens — plenty for any resume
    const trimmedText = actualText.slice(0, 6000);

    // ── Keep the prompt SHORT so output has more token budget ─
    const prompt = `Analyze this resume. Return ONLY a JSON object, no markdown, no explanation.

JSON structure (all scores are integers 0-100):
{"summary":"string","skills":["string"],"experience_years":0,"education":"string","strengths":["string","string","string"],"improvements":["string","string","string"],"recommended_roles":["string","string","string"],"overall_score":0,"scores":{"technical_skills":0,"experience":0,"education":0,"presentation":0}}

Resume:
${trimmedText}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,   // <-- was 1024, now 8192 — fixes the truncation
            responseMimeType: "application/json",  // forces pure JSON output, no fences
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini error:", response.status, errText.slice(0, 400));

      let msg = `Gemini API error ${response.status}`;
      try {
        const errJson = JSON.parse(errText);
        const detail = errJson?.error?.message || "";
        if (response.status === 401 || response.status === 403) msg = `API key invalid: ${detail}`;
        if (response.status === 404) msg = `Model not found: ${detail}`;
        if (response.status === 429) msg = "Rate limit. Wait 1 minute and try again.";
        if (response.status === 400) msg = `Bad request: ${detail}`;
      } catch { /* ignore */ }

      return new Response(
        JSON.stringify({ error: msg }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const rawText = (data.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();

    // Strip any markdown fences just in case
    const clean = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

    let analysis;
    try {
      analysis = JSON.parse(clean);
    } catch (e) {
      console.error("JSON parse failed:", clean.slice(0, 300));
      // Return a safe fallback so the app doesn't crash
      analysis = {
        summary: "Resume uploaded successfully. Manual review recommended.",
        skills: [],
        experience_years: 0,
        education: "Not detected",
        strengths: ["Resume received"],
        improvements: ["Could not fully parse — try uploading as .txt"],
        recommended_roles: ["Software Developer"],
        overall_score: 50,
        scores: { technical_skills: 50, experience: 50, education: 50, presentation: 50 },
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Unhandled error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

