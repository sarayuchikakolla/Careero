import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, BookOpen, Clock, TrendingUp, Loader2, Target, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar
} from "recharts";

interface Session {
  id: string;
  role: string;
  status: string;
  created_at: string;
  resume_analysis: any;
  scores: any;
  messages: any[];
}

const Dashboard = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await (supabase as any)
        .from("interview_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setSessions(data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const completed = sessions.filter((s) => s.status === "completed");
  const inProgress = sessions.filter((s) => s.status === "in_progress");
  const uniqueRoles = new Set(sessions.map((s) => s.role)).size;

  // Calculate scores from sessions that have them
  const scoredSessions = sessions.filter(s => s.scores?.overall || s.resume_analysis?.overall_score);
  const avgScore = scoredSessions.length
    ? Math.round(scoredSessions.reduce((a, s) => a + (s.scores?.overall || s.resume_analysis?.overall_score || 0), 0) / scoredSessions.length)
    : 0;

  // Aggregate skill scores across all scored sessions
  const aggregateSkills = () => {
    const skills: Record<string, { total: number; count: number }> = {};
    sessions.forEach(s => {
      const scoreData = s.scores || s.resume_analysis?.scores;
      if (!scoreData) return;
      Object.entries(scoreData).forEach(([key, val]) => {
        if (typeof val === "number" && key !== "overall") {
          const label = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
          if (!skills[label]) skills[label] = { total: 0, count: 0 };
          skills[label].total += val;
          skills[label].count += 1;
        }
      });
    });
    return Object.entries(skills).map(([subject, { total, count }]) => ({
      subject,
      score: Math.round(total / count),
      fullMark: 100,
    }));
  };

  // Build progress trend from sessions (oldest first)
  const trendData = [...sessions]
    .reverse()
    .map((s, i) => ({
      session: `S${i + 1}`,
      score: s.scores?.overall || s.resume_analysis?.overall_score || 0,
      role: s.role,
    }))
    .filter(d => d.score > 0);

  // Role breakdown
  const roleBreakdown = () => {
    const roles: Record<string, { total: number; count: number }> = {};
    sessions.forEach(s => {
      const score = s.scores?.overall || s.resume_analysis?.overall_score;
      if (!score) return;
      if (!roles[s.role]) roles[s.role] = { total: 0, count: 0 };
      roles[s.role].total += score;
      roles[s.role].count += 1;
    });
    return Object.entries(roles).map(([name, { total, count }]) => ({
      name,
      score: Math.round(total / count),
    }));
  };

  const radarData = aggregateSkills();
  const roleData = roleBreakdown();

  const readinessLabel = avgScore >= 80 ? "Interview Ready" : avgScore >= 60 ? "Getting There" : avgScore > 0 ? "Needs Work" : "Not Yet Scored";
  const readinessColor = avgScore >= 80 ? "text-green-500" : avgScore >= 60 ? "text-yellow-500" : avgScore > 0 ? "text-orange-500" : "text-muted-foreground";

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Track your interview preparation progress</p>
        </motion.div>

        {/* Overall Readiness Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-8 rounded-xl border border-border bg-card p-8 flex flex-col md:flex-row items-center gap-6"
        >
          <div className="relative">
            <div className="inline-flex items-center justify-center rounded-full gradient-primary h-28 w-28">
              <span className="text-3xl font-bold text-primary-foreground">{avgScore > 0 ? `${avgScore}%` : "—"}</span>
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl font-semibold text-foreground">Overall Readiness</h2>
            <p className={`text-sm font-medium mt-1 ${readinessColor}`}>{readinessLabel}</p>
            {avgScore > 0 && (
              <div className="mt-3 max-w-xs">
                <Progress value={avgScore} className="h-2" />
              </div>
            )}
            {avgScore === 0 && (
              <p className="text-xs text-muted-foreground mt-2">Complete an interview to see your readiness score</p>
            )}
          </div>
          <Link to="/interview">
            <Button className="gradient-primary text-primary-foreground border-0 hover:opacity-90 gap-2">
              <Target className="h-4 w-4" /> Start Interview <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>

        {/* Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Avg. Score" value={avgScore ? `${avgScore}%` : "—"} icon={<TrendingUp className="h-5 w-5" />} />
          <StatCard label="Total Sessions" value={sessions.length} icon={<Activity className="h-5 w-5" />} />
          <StatCard label="Completed" value={completed.length} icon={<Clock className="h-5 w-5" />} />
          <StatCard label="Roles Practiced" value={uniqueRoles} icon={<BookOpen className="h-5 w-5" />} />
        </div>

        {/* Charts Row */}
        {(radarData.length > 0 || trendData.length > 0 || roleData.length > 0) && (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {/* Skills Radar */}
            {radarData.length >= 3 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-6">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Skills Overview</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Progress Trend */}
            {trendData.length >= 2 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border border-border bg-card p-6">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Progress Trend</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="session" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                    <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" fill="url(#colorScore)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Role Breakdown */}
            {roleData.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Score by Role</h3>
                <ResponsiveContainer width="100%" height={Math.max(200, roleData.length * 50)}>
                  <BarChart data={roleData} layout="vertical">
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} width={150} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                    <Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </div>
        )}

        {/* Recent Sessions */}
        {sessions.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-16 text-center">
            <p className="text-muted-foreground mb-4">No interview sessions yet. Start your first one!</p>
            <Link to="/interview">
              <Button className="gradient-primary text-primary-foreground border-0 hover:opacity-90">
                Start Interview
              </Button>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 rounded-xl border border-border bg-card p-6"
          >
            <h3 className="mb-4 text-sm font-semibold text-foreground">Recent Sessions</h3>
            <div className="space-y-3">
              {sessions.slice(0, 10).map((s) => (
                <Link key={s.id} to={`/results?session=${s.id}`}>
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 hover:bg-muted transition-colors">
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.role}</p>
                      <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {(s.scores?.overall || s.resume_analysis?.overall_score) ? (
                        <span className="text-sm font-bold text-primary">{s.scores?.overall || s.resume_analysis?.overall_score}%</span>
                      ) : null}
                      <Badge variant={s.status === "completed" ? "secondary" : "outline"} className="text-xs capitalize">
                        {s.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
