import { supabase } from "@/integrations/supabase/client";

export interface ResumeAnalysis {
  summary: string;
  skills: string[];
  experience_years: number;
  education: string;
  strengths: string[];
  improvements: string[];
  recommended_roles: string[];
  overall_score: number;
  scores: {
    technical_skills: number;
    experience: number;
    education: number;
    presentation: number;
  };
}

export async function analyzeResume(resumeText: string): Promise<ResumeAnalysis> {
  const { data, error } = await supabase.functions.invoke("analyze-resume", {
    body: { resumeText },
  });
  if (error) throw new Error(error.message || "Failed to analyze resume");
  return data as ResumeAnalysis;
}

export interface ATSResult {
  ats_score: number;
  sections_detected: string[];
  sections_missing: string[];
  formatting_issues: string[];
  keyword_analysis: {
    matched_keywords: string[];
    missing_keywords: string[];
  };
  suggestions: string[];
  ats_friendly_resume: string;
}

export async function checkATS(resumeText: string, jobDescription?: string): Promise<ATSResult> {
  const { data, error } = await supabase.functions.invoke("ats-check", {
    body: { resumeText, jobDescription },
  });
  if (error) throw new Error(error.message || "Failed to run ATS check");
  return data as ATSResult;
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function streamInterview({
  messages,
  role,
  resumeContext,
  company,
  jobDescription,
  onDelta,
  onDone,
}: {
  messages: ChatMessage[];
  role: string;
  resumeContext?: string;
  company?: string;
  jobDescription?: string;
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/interview-chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, role, resumeContext, company, jobDescription }),
    }
  );

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Stream failed" }));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }

  if (!resp.body) throw new Error("No response body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { streamDone = true; break; }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}

export function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

// Reads a .txt/.md file as plain text, or a .pdf as a "[PDF_BASE64]..." payload
// that the analyze-resume / ats-check edge functions know how to extract text from.
export function readResumeFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(`[PDF_BASE64]${base64}`);
      };
      reader.onerror = () => reject(new Error("Failed to read PDF file"));
      reader.readAsDataURL(file);
    });
  }
  return extractTextFromFile(file);
}