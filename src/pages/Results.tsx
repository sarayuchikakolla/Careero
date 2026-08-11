import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Award, TrendingUp, AlertTriangle, Lightbulb, Loader2, ArrowLeft } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Results = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session");
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      let query = (supabase as any).from("interview_sessions").select("*").eq("user_id", user.id);
      if (sessionId) {
        query = query.eq("id", sessionId);
      } else {
        query = query.order("created_at", { ascending: false }).limit(1);
      }
      const { data } = await query.maybeSingle();
      setSession(data);
      setLoading(false);
    };
    load();
  }, [user, sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-6 pt-24 pb-16 text-center">
          <p className="text-muted-foreground mb-4">No interview results found. Take an interview first!</p>
          <Link to="/interview">
            <Button className="gradient-primary text-primary-foreground border-0 hover:opacity-90">
              Start Interview
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  // Use interview scores (from AI evaluation) if available, fallback to resume_analysis
  const interviewScores = session.scores;
  const analysis = session.resume_analysis;
  const overallScore = interviewScores?.overall ?? analysis?.overall_score ?? 0;
  
  const scores = interviewScores 
    ? {
        technical_skills: interviewScores.technical_skills,
        communication: interviewScores.communication,
        confidence: interviewScores.confidence,
        problem_solving: interviewScores.problem_solving,
        behavioural_fit: interviewScores.behavioural_fit,
      }
    : (analysis?.scores || {});

  const strengths = analysis?.strengths || [];
  const improvements = analysis?.improvements || [];
  const messages = session.messages || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Interview Results</h1>
          <p className="mt-1 text-muted-foreground">{session.role} • {new Date(session.created_at).toLocaleDateString()}</p>
        </motion.div>

        {/* Overall Score */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 rounded-xl border border-border bg-card p-8 text-center">
          <div className="inline-flex items-center justify-center rounded-full gradient-primary h-24 w-24 mb-4">
            <span className="text-3xl font-bold text-primary-foreground">{overallScore}%</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Overall Readiness Score</h2>
          <Badge className="mt-3 gradient-primary text-primary-foreground border-0">
            {overallScore >= 80 ? "Interview Ready" : overallScore >= 60 ? "Getting There" : overallScore > 0 ? "Needs Work" : "Not Scored"}
          </Badge>
          {interviewScores && (
            <p className="text-xs text-muted-foreground mt-2">Based on AI interview evaluation</p>
          )}
          {!interviewScores && analysis && (
            <p className="text-xs text-muted-foreground mt-2">Based on resume analysis (complete interview for detailed scores)</p>
          )}
        </motion.div>

        {/* Score breakdown */}
        {Object.keys(scores).length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-8 rounded-xl border border-border bg-card p-6">
            <h3 className="mb-6 text-sm font-semibold text-foreground">
              {interviewScores ? "Interview Performance Breakdown" : "Resume Score Breakdown"}
            </h3>
            <div className="space-y-5">
              {Object.entries(scores).map(([key, val]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground capitalize">{key.replace(/_/g, " ")}</span>
                    <span className="text-sm font-bold text-foreground">{val as number}%</span>
                  </div>
                  <Progress value={val as number} className="h-2" />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Strengths & Improvements */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {strengths.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-5 w-5 text-success" />
                <h3 className="text-sm font-semibold text-foreground">Strengths</h3>
              </div>
              <ul className="space-y-3">
                {strengths.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <TrendingUp className="h-4 w-4 mt-0.5 text-success shrink-0" />
                    <span className="text-muted-foreground">{s}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {improvements.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <h3 className="text-sm font-semibold text-foreground">Areas to Improve</h3>
              </div>
              <ul className="space-y-3">
                {improvements.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <Lightbulb className="h-4 w-4 mt-0.5 text-warning shrink-0" />
                    <span className="text-muted-foreground">{s}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>

        {/* Chat transcript */}
        {messages.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8 rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Interview Transcript</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {messages.map((msg: any, i: number) => (
                <div key={i} className={`rounded-lg px-4 py-3 text-sm ${msg.role === "user" ? "bg-primary/10 ml-8" : "bg-muted mr-8"}`}>
                  <p className="text-xs font-medium text-muted-foreground mb-1 capitalize">{msg.role === "assistant" ? "Interviewer" : "You"}</p>
                  <p className="text-foreground">{msg.content}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Results;
