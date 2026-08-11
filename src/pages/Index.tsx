import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Brain, BarChart3, Target, Sparkles, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import heroBg from "@/assets/hero-bg.jpg";

const features = [
  {
    icon: <Brain className="h-6 w-6" />,
    title: "AI-Powered Interviews",
    description: "Smart questions adapted to your skills, experience level, and target role.",
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Deep Analytics",
    description: "Performance metrics across technical, communication, and behavioural dimensions.",
  },
  {
    icon: <Target className="h-6 w-6" />,
    title: "Skill Gap Analysis",
    description: "Identify weaknesses and get personalised improvement strategies.",
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: "Career Recommendations",
    description: "AI-suggested roles, companies, and skill-building pathways tailored to you.",
  },
];

const stats = [
  { value: "10K+", label: "Interviews Conducted" },
  { value: "92%", label: "Improvement Rate" },
  { value: "4.8★", label: "User Rating" },
  { value: "150+", label: "Job Categories" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        </div>

        <div className="container relative z-10 mx-auto px-6 pt-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              <Zap className="h-3.5 w-3.5" />
              AI-Powered Interview Preparation
            </div>

            <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Ace Every Interview with{" "}
              <span className="text-gradient-primary">Careero</span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Practice with AI-driven mock interviews, get real-time feedback on your responses, and
              track your progress with professional analytics dashboards.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/interview">
                <Button size="lg" className="gradient-primary text-primary-foreground border-0 hover:opacity-90 px-8 text-base animate-pulse-glow">
                  Start Mock Interview
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="px-8 text-base">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card/50">
        <div className="container mx-auto px-6 py-16">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-8 md:grid-cols-4"
          >
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={item} className="text-center">
                <p className="text-3xl font-bold text-gradient-primary">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Everything You Need to{" "}
              <span className="text-gradient-primary">Succeed</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              A complete platform for interview preparation, from practice to analytics.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={item}
                className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:glow-primary"
              >
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary group-hover:gradient-primary group-hover:text-primary-foreground transition-colors">
                  {feature.icon}
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-card/50 border-y border-border">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">How It Works</h2>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mx-auto max-w-2xl space-y-6"
          >
            {[
              "Upload your resume and set job preferences",
              "AI generates tailored interview questions",
              "Answer questions via text in a realistic setting",
              "Get instant AI-powered feedback and scores",
              "Track progress and follow improvement plans",
            ].map((step, i) => (
              <motion.div
                key={i}
                variants={item}
                className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full gradient-primary text-sm font-bold text-primary-foreground">
                  {i + 1}
                </div>
                <p className="text-foreground">{step}</p>
                <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-primary/40" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Ready to <span className="text-gradient-primary">Level Up</span>?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Start your first AI mock interview today — it's free.
            </p>
            <Link to="/interview">
              <Button size="lg" className="mt-8 gradient-primary text-primary-foreground border-0 hover:opacity-90 px-10">
                Get Started Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>© 2026 Careero. AI-Driven Interview & Career Development.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
