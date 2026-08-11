import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Upload, FileText, Loader2, CheckCircle2, XCircle, AlertTriangle,
  Copy, Download, RotateCcw, ScanSearch,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { checkATS, readResumeFile, type ATSResult } from "@/lib/ai";

const scoreColor = (score: number) =>
  score >= 80 ? "text-success" : score >= 55 ? "text-warning" : "text-destructive";

const scoreLabel = (score: number) =>
  score >= 80 ? "Strong ATS match" : score >= 55 ? "Needs improvement" : "Likely to be filtered out";

const ATSChecker = () => {
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<ATSResult | null>(null);
  const { toast } = useToast();

  const handleFile = useCallback(async (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["txt", "md", "pdf"].includes(ext || "")) {
      toast({ title: "Unsupported format", description: "Please upload a .txt, .md, or .pdf file.", variant: "destructive" });
      return;
    }
    if (ext === "pdf" && f.size > 4 * 1024 * 1024) {
      toast({ title: "PDF too large", description: "Please use a PDF under 4 MB, or paste your resume as text.", variant: "destructive" });
      return;
    }

    setFile(f);
    try {
      const text = await readResumeFile(f);
      setResumeText(text);
    } catch (e) {
      toast({ title: "Couldn't read file", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const runCheck = async () => {
    if (!resumeText.trim() || resumeText.trim().length < 50) {
      toast({ title: "Resume too short", description: "Upload or paste a resume with more content first.", variant: "destructive" });
      return;
    }
    setChecking(true);
    setResult(null);
    try {
      const res = await checkATS(resumeText, jobDescription.trim() || undefined);
      setResult(res);
    } catch (e) {
      toast({ title: "ATS check failed", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
    } finally {
      setChecking(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResumeText("");
    setJobDescription("");
    setResult(null);
  };

  const copyRewrite = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.ats_friendly_resume);
    toast({ title: "Copied", description: "ATS-friendly resume copied to clipboard." });
  };

  const downloadRewrite = () => {
    if (!result) return;
    const blob = new Blob([result.ats_friendly_resume], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ats-friendly-resume.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-6 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-3xl">

          <div className="text-center mb-8">
            <div className="gradient-primary rounded-2xl p-4 inline-block mb-4">
              <ScanSearch className="h-10 w-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">ATS Resume Checker</h1>
            <p className="mt-2 text-muted-foreground">
              See your resume the way an Applicant Tracking System does — score, gaps, and an ATS-friendly rewrite.
            </p>
          </div>

          {!result ? (
            <div className="space-y-6">
              {/* Upload */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">1. Upload or paste your resume</p>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 text-center hover:border-primary/40 transition-colors cursor-pointer"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".txt,.md,.pdf";
                    input.onchange = (e) => {
                      const f = (e.target as HTMLInputElement).files?.[0];
                      if (f) handleFile(f);
                    };
                    input.click();
                  }}
                >
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-foreground">Drop your resume here</p>
                  <p className="text-xs text-muted-foreground mt-1">Supports .txt, .md, .pdf (under 4 MB)</p>
                  {file && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" /> {file.name}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">or paste the text directly below</p>
                <Textarea
                  value={resumeText.startsWith("[PDF_BASE64]") ? "" : resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder={resumeText.startsWith("[PDF_BASE64]") ? "PDF loaded — text will be extracted on check" : "Paste your resume text here..."}
                  className="min-h-[140px] mt-3"
                  disabled={resumeText.startsWith("[PDF_BASE64]")}
                />
                {resumeText.startsWith("[PDF_BASE64]") && (
                  <Button variant="ghost" size="sm" className="mt-1" onClick={() => { setFile(null); setResumeText(""); }}>
                    Clear PDF and paste text instead
                  </Button>
                )}
              </div>

              {/* Optional JD */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">
                  2. Job description <span className="font-normal text-muted-foreground">(optional, but recommended)</span>
                </p>
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description to check keyword match against this specific role..."
                  className="min-h-[100px]"
                />
              </div>

              <Button
                onClick={runCheck}
                disabled={checking || !resumeText.trim()}
                className="w-full gradient-primary text-primary-foreground border-0 hover:opacity-90"
                size="lg"
              >
                {checking ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Analyzing against ATS rules...</span>
                ) : (
                  "Run ATS Check"
                )}
              </Button>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

              {/* Score */}
              <div className="rounded-xl border border-border bg-card p-6 text-center">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">ATS Compatibility Score</p>
                <p className={`text-5xl font-bold ${scoreColor(result.ats_score)}`}>{result.ats_score}<span className="text-2xl text-muted-foreground">/100</span></p>
                <p className={`text-sm font-medium mt-2 ${scoreColor(result.ats_score)}`}>{scoreLabel(result.ats_score)}</p>
                <Progress value={result.ats_score} className="h-1.5 mt-4 max-w-xs mx-auto" />
              </div>

              {/* Sections */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-sm font-semibold text-foreground mb-3">Resume Sections</h3>
                <div className="flex flex-wrap gap-2">
                  {result.sections_detected.map((s) => (
                    <Badge key={s} variant="outline" className="text-xs bg-success/10 text-success border-success/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> {s}
                    </Badge>
                  ))}
                  {result.sections_missing.map((s) => (
                    <Badge key={s} variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20">
                      <XCircle className="h-3 w-3 mr-1" /> {s} missing
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Formatting issues */}
              {result.formatting_issues.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-warning" /> Formatting Issues
                  </h3>
                  <ul className="space-y-1.5">
                    {result.formatting_issues.map((issue, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-warning mt-0.5">•</span> {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Keywords */}
              {(result.keyword_analysis.matched_keywords.length > 0 || result.keyword_analysis.missing_keywords.length > 0) && (
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Keyword Match</h3>
                  {result.keyword_analysis.matched_keywords.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Matched</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.keyword_analysis.matched_keywords.map((k) => (
                          <Badge key={k} variant="secondary" className="text-xs">{k}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.keyword_analysis.missing_keywords.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Missing</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.keyword_analysis.missing_keywords.map((k) => (
                          <Badge key={k} variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20">{k}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Suggestions */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-sm font-semibold text-foreground mb-3">Suggestions</h3>
                <ul className="space-y-2">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                      <span className="shrink-0 rounded-full bg-primary/10 text-primary text-xs font-semibold h-5 w-5 flex items-center justify-center mt-0.5">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* ATS-friendly rewrite */}
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">ATS-Friendly Rewrite</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyRewrite}>
                      <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadRewrite}>
                      <Download className="h-3.5 w-3.5 mr-1" /> Download .txt
                    </Button>
                  </div>
                </div>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-4 max-h-96 overflow-y-auto font-mono">
                  {result.ats_friendly_resume}
                </pre>
              </div>

              <Button variant="ghost" onClick={reset} className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" /> Check Another Resume
              </Button>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default ATSChecker;