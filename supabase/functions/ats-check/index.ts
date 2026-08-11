import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { resumeText, jobDescription } = await req.json();

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

    // ── PDF handling (same pattern as analyze-resume) ─────────
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

    // ── Trim to avoid hitting input token limits ──────────────
    const trimmedResume = actualText.slice(0, 6000);
    const trimmedJD = (jobDescription || "").slice(0, 3000);

    const jdBlock = trimmedJD
      ? `\nJob Description to match against:\n${trimmedJD}\n\nCompare the resume's keywords, skills, and phrasing against this job description specifically.`
      : `\nNo job description was provided — evaluate general ATS compatibility and keyword strength for the resume's apparent target role instead.`;

    // ── Keep prompt tight so output has token budget for the rewrite ──
    const prompt = `You are an ATS (Applicant Tracking System) resume screening simulator, similar to systems used by Workday, Taleo, and Greenhouse. Analyze this resume for ATS compatibility.
${jdBlock}

Return ONLY a JSON object, no markdown, no explanation, matching EXACTLY this structure:
{
  "ats_score": 0,
  "sections_detected": ["string"],
  "sections_missing": ["string"],
  "formatting_issues": ["string"],
  "keyword_analysis": {
    "matched_keywords": ["string"],
    "missing_keywords": ["string"]
  },
  "suggestions": ["string"],
  "ats_friendly_resume": "string"
}

Rules:
- ats_score: integer 0-100 reflecting how well an ATS would parse and rank this resume
- sections_detected/sections_missing: check for Contact Info, Summary, Experience, Education, Skills, Certifications, Projects
- formatting_issues: flag things ATS systems struggle with — tables, columns, graphics/icons in text, headers/footers, non-standard section titles, missing dates, inconsistent formatting, unusual fonts implied by odd characters
- keyword_analysis: if a job description was given, compare against it; otherwise infer likely target-role keywords from the resume itself and note which strong keywords are present vs commonly expected but missing
- suggestions: 4-6 concrete, actionable fixes, ordered by impact
- ats_friendly_resume: a rewritten, plain-text, single-column version of the resume optimized for ATS parsing — standard section headers (SUMMARY, EXPERIENCE, EDUCATION, SKILLS), no tables/graphics, consistent bullet points using "-", dates in MM/YYYY format, and natural keyword inclusion where the resume supports it. Do not fabricate experience, employers, dates, or skills the candidate doesn't have — only reformat and rephrase what's already there.

Resume:
${trimmedResume}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
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

    const clean = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

    let result;
    try {
      result = JSON.parse(clean);
    } catch (e) {
      console.error("JSON parse failed:", clean.slice(0, 300));
      result = {
        ats_score: 50,
        sections_detected: [],
        sections_missing: [],
        formatting_issues: ["Could not fully analyze — try uploading as .txt"],
        keyword_analysis: { matched_keywords: [], missing_keywords: [] },
        suggestions: ["Try again, or upload your resume as a .txt file for more reliable parsing."],
        ats_friendly_resume: trimmedResume,
      };
    }

    return new Response(JSON.stringify(result), {
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