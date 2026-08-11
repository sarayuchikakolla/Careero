import { motion } from "framer-motion";
import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
}

const StatCard = ({ label, value, icon, trend, trendUp }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-xl border border-border bg-card p-6 hover:glow-primary transition-shadow duration-300"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
        {trend && (
          <p className={`mt-1 text-xs font-medium ${trendUp ? "text-success" : "text-destructive"}`}>
            {trend}
          </p>
        )}
      </div>
      <div className="rounded-lg bg-primary/10 p-3 text-primary">{icon}</div>
    </div>
  </motion.div>
);

export default StatCard;
