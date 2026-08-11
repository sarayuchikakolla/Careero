import { motion } from "framer-motion";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar
} from "recharts";

const radarData = [
  { subject: "Technical", score: 78, fullMark: 100 },
  { subject: "Communication", score: 85, fullMark: 100 },
  { subject: "Problem Solving", score: 72, fullMark: 100 },
  { subject: "Confidence", score: 68, fullMark: 100 },
  { subject: "Behavioural", score: 82, fullMark: 100 },
  { subject: "Domain Knowledge", score: 75, fullMark: 100 },
];

const trendData = [
  { session: "S1", score: 52 },
  { session: "S2", score: 58 },
  { session: "S3", score: 65 },
  { session: "S4", score: 61 },
  { session: "S5", score: 72 },
  { session: "S6", score: 78 },
  { session: "S7", score: 76 },
  { session: "S8", score: 82 },
];

const categoryData = [
  { name: "React", score: 85 },
  { name: "System Design", score: 62 },
  { name: "DSA", score: 74 },
  { name: "SQL", score: 78 },
  { name: "Behavioural", score: 88 },
];

export const SkillRadar = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="rounded-xl border border-border bg-card p-6"
  >
    <h3 className="mb-4 text-sm font-semibold text-foreground">Skills Overview</h3>
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={radarData}>
        <PolarGrid stroke="hsl(220 13% 91% / 0.3)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(220 9% 46%)", fontSize: 11 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          name="Score"
          dataKey="score"
          stroke="hsl(172 66% 45%)"
          fill="hsl(172 66% 45%)"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  </motion.div>
);

export const ProgressTrend = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="rounded-xl border border-border bg-card p-6"
  >
    <h3 className="mb-4 text-sm font-semibold text-foreground">Progress Trend</h3>
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={trendData}>
        <defs>
          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(172 66% 45%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(172 66% 45%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="hsl(220 13% 91% / 0.15)" strokeDasharray="3 3" />
        <XAxis dataKey="session" tick={{ fill: "hsl(220 9% 46%)", fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fill: "hsl(220 9% 46%)", fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            background: "hsl(224 25% 10%)",
            border: "1px solid hsl(224 20% 18%)",
            borderRadius: "8px",
            color: "hsl(210 40% 96%)",
          }}
        />
        <Area
          type="monotone"
          dataKey="score"
          stroke="hsl(172 66% 45%)"
          fill="url(#colorScore)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  </motion.div>
);

export const CategoryBreakdown = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="rounded-xl border border-border bg-card p-6"
  >
    <h3 className="mb-4 text-sm font-semibold text-foreground">Category Breakdown</h3>
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={categoryData} layout="vertical">
        <CartesianGrid stroke="hsl(220 13% 91% / 0.15)" strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(220 9% 46%)", fontSize: 11 }} />
        <YAxis type="category" dataKey="name" tick={{ fill: "hsl(220 9% 46%)", fontSize: 11 }} width={100} />
        <Tooltip
          contentStyle={{
            background: "hsl(224 25% 10%)",
            border: "1px solid hsl(224 20% 18%)",
            borderRadius: "8px",
            color: "hsl(210 40% 96%)",
          }}
        />
        <Bar dataKey="score" fill="hsl(172 66% 45%)" radius={[0, 6, 6, 0]} barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  </motion.div>
);
