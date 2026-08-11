import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Users, Activity, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface SessionRow {
  id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  scores: any;
  profiles: { full_name: string } | null;
}

const Admin = () => {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase as any)
        .from("interview_sessions")
        .select("*, profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(50);
      setSessions((data as any) || []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
          </div>
          <p className="text-muted-foreground">View all user interview sessions</p>
        </motion.div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-6">
            <Users className="h-5 w-5 text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">{new Set(sessions.map(s => s.user_id)).size}</p>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <Activity className="h-5 w-5 text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">{sessions.length}</p>
            <p className="text-sm text-muted-foreground">Total Sessions</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <Activity className="h-5 w-5 text-success mb-2" />
            <p className="text-2xl font-bold text-foreground">{sessions.filter(s => s.status === "completed").length}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">All Interview Sessions</h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No sessions yet</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {(s.profiles as any)?.full_name || "Unknown User"}
                    </p>
                    <p className="text-xs text-muted-foreground">{s.role} • {new Date(s.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {s.scores && (
                      <span className="text-sm font-bold text-primary">
                        {(s.scores as any)?.overall_score ?? "—"}%
                      </span>
                    )}
                    <Badge variant={s.status === "completed" ? "secondary" : "outline"} className="text-xs capitalize">
                      {s.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;
