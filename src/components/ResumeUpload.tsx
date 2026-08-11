import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Loader2, CheckCircle, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { analyzeResume, extractTextFromFile, type ResumeAnalysis } from "@/lib/ai";

interface ResumeUploadProps {
  onAnalysisComplete: (analysis: ResumeAnalysis) => void;
  analysis: ResumeAnalysis | null;
}

const ResumeUpload = ({ onAnalysisComplete, analysis }: ResumeUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleFile = useCallback(async (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["txt", "md", "pdf"].includes(ext || "")) {
      toast({ title: "Unsupported format", description: "Please upload a .txt, .md, or .pdf file.", variant: "destructive" });
      return;
    }

    // PDF size check — Gemini Vision accepts up to ~20MB but base64 encoding
    // triples the size; keep safe at 4MB source = ~12MB base64
    if (ext === "pdf" && f.size > 4 * 1024 * 1024) {
      toast({
        title: "PDF too large",
        description: "Please use a PDF under 4 MB, or copy-paste your resume as a .txt file.",
        variant: "destructive",
      });
      return;
    }

    setFile(f);
    setAnalyzing(true);

    try {
      let text: string;

      if (ext === "pdf") {
        // Safe base64 conversion using FileReader (works for any file size, no btoa crash)
        text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // result is "data:application/pdf;base64,XXXX..."
            // strip the prefix to get raw base64
            const base64 = result.split(",")[1];
            resolve(`[PDF_BASE64]${base64}`);
          };
          reader.onerror = () => reject(new Error("Failed to read PDF file"));
          reader.readAsDataURL(f);
        });
      } else {
        text = await extractTextFromFile(f);
      }

      if (!text.startsWith("[PDF_BASE64]") && text.trim().length < 50) {
        toast({ title: "Resume too short", description: "Please upload a resume with more content.", variant: "destructive" });
        setAnalyzing(false);
        return;
      }

      const result = await analyzeResume(text);
      onAnalysisComplete(result);
      toast({ title: "Resume analyzed!", description: "Your resume has been analyzed successfully." });
    } catch (e) {
      console.error(e);
      toast({
        title: "Analysis failed",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  }, [onAnalysisComplete, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  if (analysis) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-success" />
            <h3 className="text-sm font-semibold text-foreground">Resume Analysis</h3>
            <Badge variant="secondary" className="ml-auto">{analysis.overall_score}% Score</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{analysis.summary}</p>

          <div className="space-y-3 mb-6">
            {Object.entries(analysis.scores).map(([key, val]) => (
              <div key={key}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-muted-foreground capitalize">{key.replace("_", " ")}</span>
                  <span className="text-xs font-bold text-foreground">{val}%</span>
                </div>
                <Progress value={val} className="h-1.5" />
              </div>
            ))}
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold text-foreground mb-2">Skills Detected</p>
            <div className="flex flex-wrap gap-1.5">
              {analysis.skills.slice(0, 10).map((s) => (
                <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-warning" /> Areas to Improve
            </p>
            <ul className="space-y-1">
              {analysis.improvements.map((imp, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-warning mt-0.5">•</span> {imp}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={() => { setFile(null); onAnalysisComplete(null as any); }}>
          <X className="h-3.5 w-3.5 mr-1" /> Upload Different Resume
        </Button>
      </motion.div>
    );
  }

  return (
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
      {analyzing ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Analyzing your resume with AI...</p>
          <p className="text-xs text-muted-foreground">This may take 10–20 seconds</p>
        </div>
      ) : (
        <>
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">Drop your resume here</p>
          <p className="text-xs text-muted-foreground mt-1">Supports .txt, .md, .pdf (under 4 MB)</p>
          {file && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" /> {file.name}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ResumeUpload;
