import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, RotateCcw, Mic, MicOff, Volume2, VolumeX, Building2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Navbar from "@/components/Navbar";
import ResumeUpload from "@/components/ResumeUpload";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { streamInterview, type ChatMessage, type ResumeAnalysis } from "@/lib/ai";
import { extractScoresFromMessage } from "@/lib/scores";
import { useSpeechRecognition, useSpeechSynthesis } from "@/hooks/use-speech";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

// Default/general role list — shown for "general" or any company without a custom list
const DEFAULT_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Engineer",
  "Data Scientist",
  "Product Manager",
  "DevOps Engineer",
  "Machine Learning Engineer",
  "Mobile Developer",
];

// Roles actually hired for at each company — keeps the role dropdown (and the
// questions generated from role + company) relevant instead of generic.
const COMPANY_ROLES: Record<string, string[]> = {
  google: [
    "Software Engineer", "Backend Developer", "Frontend Developer",
    "Data Scientist", "Machine Learning Engineer", "Product Manager", "Site Reliability Engineer",
  ],
  amazon: [
    "Software Development Engineer", "Backend Developer", "Data Scientist",
    "DevOps Engineer", "Product Manager", "Solutions Architect",
  ],
  microsoft: [
    "Software Engineer", "Backend Developer", "Frontend Developer",
    "Data Scientist", "Product Manager", "Cloud Solutions Engineer",
  ],
  apple: [
    "Software Engineer", "iOS Developer", "Mobile Developer",
    "Machine Learning Engineer", "Hardware Engineer", "Product Manager",
  ],
  meta: [
    "Software Engineer", "Frontend Developer", "Backend Developer",
    "Data Scientist", "Machine Learning Engineer", "Product Manager",
  ],
  netflix: [
    "Software Engineer", "Backend Developer", "Data Scientist",
    "Machine Learning Engineer", "DevOps Engineer", "Product Manager",
  ],
  uber: [
    "Backend Developer", "Full Stack Engineer", "Mobile Developer",
    "Data Scientist", "Machine Learning Engineer", "Site Reliability Engineer", "Product Manager",
  ],
  airbnb: [
    "Full Stack Engineer", "Frontend Developer", "Backend Developer",
    "Data Scientist", "Product Manager", "Mobile Developer",
  ],
  adobe: [
    "Software Engineer", "Frontend Developer", "Backend Developer",
    "Product Manager", "Machine Learning Engineer",
  ],
  salesforce: [
    "Software Engineer", "Backend Developer", "Full Stack Engineer",
    "DevOps Engineer", "Product Manager", "Solutions Architect",
  ],
  oracle: [
    "Software Engineer", "Backend Developer", "Database Engineer",
    "Cloud Solutions Engineer", "DevOps Engineer",
  ],
  flipkart: [
    "Backend Developer", "Full Stack Engineer", "Frontend Developer",
    "Data Scientist", "Product Manager", "Mobile Developer",
  ],
  swiggy: [
    "Backend Developer", "Full Stack Engineer", "Mobile Developer",
    "Data Scientist", "Product Manager", "DevOps Engineer",
  ],
  zomato: [
    "Backend Developer", "Full Stack Engineer", "Mobile Developer",
    "Data Scientist", "Product Manager",
  ],
  paytm: [
    "Backend Developer", "Full Stack Engineer", "Mobile Developer",
    "Data Scientist", "DevOps Engineer", "Product Manager",
  ],
  tcs: [
    "Software Engineer", "Backend Developer", "Frontend Developer",
    "Full Stack Engineer", "DevOps Engineer", "Business Analyst",
  ],
  infosys: [
    "Software Engineer", "Backend Developer", "Frontend Developer",
    "Full Stack Engineer", "DevOps Engineer", "Business Analyst",
  ],
  wipro: [
    "Software Engineer", "Backend Developer", "Frontend Developer",
    "Full Stack Engineer", "DevOps Engineer", "Business Analyst",
  ],
  hcl: [
    "Software Engineer", "Backend Developer", "Frontend Developer",
    "Full Stack Engineer", "DevOps Engineer",
  ],
  cognizant: [
    "Software Engineer", "Backend Developer", "Frontend Developer",
    "Full Stack Engineer", "Business Analyst",
  ],
  accenture: [
    "Software Engineer", "Backend Developer", "Frontend Developer",
    "Business Analyst", "Product Manager", "DevOps Engineer",
  ],
  capgemini: [
    "Software Engineer", "Backend Developer", "Frontend Developer",
    "Full Stack Engineer", "DevOps Engineer",
  ],
  deloitte: [
    "Business Analyst", "Data Scientist", "Software Engineer",
    "Product Manager", "DevOps Engineer",
  ],
  jpmorgan: [
    "Software Engineer", "Backend Developer", "Data Scientist",
    "Quantitative Analyst", "DevOps Engineer",
  ],
  goldman: [
    "Software Engineer", "Backend Developer", "Data Scientist",
    "Quantitative Analyst", "DevOps Engineer",
  ],
  startup: [
    "Full Stack Engineer", "Frontend Developer", "Backend Developer",
    "Product Manager", "Mobile Developer", "DevOps Engineer",
  ],
};

const getRolesForCompany = (company: string): string[] =>
  COMPANY_ROLES[company] ?? DEFAULT_ROLES;

const COMPANY_GROUPS = [
  {
    label: "General",
    options: [
      { value: "general", label: "No specific company (General)" },
    ],
  },
  {
    label: "Big Tech",
    options: [
      { value: "google", label: "🔵 Google" },
      { value: "amazon", label: "🟠 Amazon" },
      { value: "microsoft", label: "🟦 Microsoft" },
      { value: "apple", label: "🍎 Apple" },
      { value: "meta", label: "🔷 Meta" },
      { value: "netflix", label: "🔴 Netflix" },
    ],
  },
  {
    label: "Product & Unicorns",
    options: [
      { value: "uber", label: "⬛ Uber" },
      { value: "airbnb", label: "🏠 Airbnb" },
      { value: "adobe", label: "🅰️ Adobe" },
      { value: "salesforce", label: "☁️ Salesforce" },
      { value: "oracle", label: "🔶 Oracle" },
      { value: "flipkart", label: "🛒 Flipkart" },
      { value: "swiggy", label: "🍔 Swiggy" },
      { value: "zomato", label: "🍽️ Zomato" },
      { value: "paytm", label: "💳 Paytm" },
    ],
  },
  {
    label: "Indian IT Services",
    options: [
      { value: "tcs", label: "🏢 TCS" },
      { value: "infosys", label: "🏢 Infosys" },
      { value: "wipro", label: "🏢 Wipro" },
      { value: "hcl", label: "🏢 HCLTech" },
      { value: "cognizant", label: "🏢 Cognizant" },
      { value: "accenture", label: "🏢 Accenture" },
      { value: "capgemini", label: "🏢 Capgemini" },
      { value: "deloitte", label: "🏢 Deloitte" },
    ],
  },
  {
    label: "Finance",
    options: [
      { value: "jpmorgan", label: "🏦 JPMorgan Chase" },
      { value: "goldman", label: "🏦 Goldman Sachs" },
    ],
  },
  {
    label: "Other",
    options: [
      { value: "startup", label: "🚀 Startup / Product Company" },
    ],
  },
];

const COMPANY_LABELS: Record<string, string> = {
  google: "Google Style", amazon: "Amazon Style", microsoft: "Microsoft Style",
  apple: "Apple Style", meta: "Meta Style", netflix: "Netflix Style",
  uber: "Uber Style", airbnb: "Airbnb Style", adobe: "Adobe Style",
  salesforce: "Salesforce Style", oracle: "Oracle Style", flipkart: "Flipkart Style",
  swiggy: "Swiggy Style", zomato: "Zomato Style", paytm: "Paytm Style",
  tcs: "TCS Style", infosys: "Infosys Style", wipro: "Wipro Style",
  hcl: "HCLTech Style", cognizant: "Cognizant Style", accenture: "Accenture Style",
  capgemini: "Capgemini Style", deloitte: "Deloitte Style",
  jpmorgan: "JPMorgan Style", goldman: "Goldman Sachs Style",
  startup: "Startup Style",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const Interview = () => {
  const [selectedRole,    setSelectedRole]    = useState("");
  const [selectedCompany, setSelectedCompany] = useState("general");
  const [jobDescription,  setJobDescription]  = useState("");
  const [started,         setStarted]         = useState(false);
  const [messages,        setMessages]        = useState<ChatMessage[]>([]);
  const [input,           setInput]           = useState("");
  const [isStreaming,     setIsStreaming]      = useState(false);
  const [resumeAnalysis,  setResumeAnalysis]  = useState<ResumeAnalysis | null>(null);
  const [sessionId,       setSessionId]       = useState<string | null>(null);
  const [voiceMode,       setVoiceMode]       = useState(false);
  const [autoSpeak,       setAutoSpeak]       = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast }  = useToast();
  const { user }   = useAuth();
  const navigate   = useNavigate();

  // Role options track the selected company so the dropdown — and the
  // questions later generated from role + company — stay relevant.
  const availableRoles = getRolesForCompany(selectedCompany);

  const handleCompanyChange = (company: string) => {
    setSelectedCompany(company);
    const rolesForCompany = getRolesForCompany(company);
    // If the currently picked role doesn't exist for the new company, clear it
    // so we never send a mismatched role/company pair to the interview API.
    if (selectedRole && !rolesForCompany.includes(selectedRole)) {
      setSelectedRole("");
    }
  };

  const { isListening, transcript, supported: sttSupported, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const { isSpeaking, supported: ttsSupported, speak, stop: stopSpeaking } = useSpeechSynthesis();

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (transcript) setInput(transcript); }, [transcript]);

  const getCompanyForAPI = () =>
    selectedCompany === "general" ? undefined : selectedCompany;

  const buildResumeContext = () =>
    resumeAnalysis
      ? `Skills: ${resumeAnalysis.skills.join(", ")}. Experience: ${resumeAnalysis.experience_years} years. Strengths: ${resumeAnalysis.strengths.join(", ")}. Education: ${resumeAnalysis.education}.`
      : undefined;

  const createSession = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      const { data, error } = await db
        .from("interview_sessions")
        .insert({
          user_id: user.id,
          role: selectedRole,
          company: getCompanyForAPI() || null,
          job_description: jobDescription.trim() || null,
          resume_analysis: resumeAnalysis,
          messages: [],
          status: "in_progress",
        })
        .select("id")
        .single();
      if (error) console.error("createSession:", error.message);
      return data?.id ?? null;
    } catch (e) {
      console.error("createSession error:", e);
      return null;
    }
  };

  const updateSession = async (id: string, msgs: ChatMessage[], status?: string, scores?: object) => {
    try {
      await db
        .from("interview_sessions")
        .update({
          messages: msgs,
          ...(status ? { status } : {}),
          ...(scores ? { scores } : {}),
        })
        .eq("id", id);
    } catch (e) {
      console.error("updateSession:", e);
    }
  };

  const runStream = (msgs: ChatMessage[], onDoneExtra: (t: string) => void) => {
    let assistantText = "";

    streamInterview({
      messages: msgs,
      role: selectedRole,
      resumeContext: buildResumeContext(),
      company: getCompanyForAPI(),
      jobDescription: jobDescription.trim() || undefined,
      onDelta: (chunk: string) => {
        assistantText += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant")
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText } : m);
          return [...prev, { role: "assistant" as const, content: assistantText }];
        });
      },
      onDone: () => {
        setIsStreaming(false);
        if (voiceMode && autoSpeak && assistantText) speak(assistantText);
        onDoneExtra(assistantText);
      },
    }).catch((e: Error) => {
      toast({ title: "Interview Error", description: e.message, variant: "destructive" });
      setIsStreaming(false);
    });
  };

  const startInterview = async () => {
    if (!selectedRole) return;
    setStarted(true);
    setIsStreaming(true);
    const sid = await createSession();
    setSessionId(sid);
    runStream([], text => {
      if (sid) updateSession(sid, [{ role: "assistant", content: text }]);
    });
  };

  const sendAnswer = async () => {
    if (!input.trim() || isStreaming) return;
    if (isListening) stopListening();
    const userMsg: ChatMessage = { role: "user", content: input };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    resetTranscript();
    setIsStreaming(true);
    runStream(updated, text => {
      if (sessionId) {
        const final = [...updated, { role: "assistant" as const, content: text }];
        const scores = extractScoresFromMessage(text);
        updateSession(sessionId, final, scores ? "completed" : undefined, scores ?? undefined);
      }
    });
  };

  const endInterview = async () => {
    stopSpeaking();
    if (sessionId) {
      const last = [...messages].reverse().find(m => m.role === "assistant");
      const scores = last ? extractScoresFromMessage(last.content) : null;
      await updateSession(sessionId, messages, "completed", scores ?? undefined);
    }
    navigate("/results" + (sessionId ? `?session=${sessionId}` : ""));
  };

  const reset = () => {
    stopSpeaking();
    setStarted(false);
    setMessages([]);
    setInput("");
    setSelectedRole("");
    setSelectedCompany("general");
    setJobDescription("");
    setResumeAnalysis(null);
    setSessionId(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex flex-1 flex-col container mx-auto px-6 pt-24 pb-8">

        {!started ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="mx-auto w-full max-w-2xl mt-8">

            <div className="text-center mb-8">
              <div className="gradient-primary rounded-2xl p-4 inline-block mb-4">
                <Bot className="h-10 w-10 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">AI Mock Interview</h1>
              <p className="mt-2 text-muted-foreground">
                Upload your resume for personalised questions, then start a live AI interview.
              </p>
            </div>

            <div className="space-y-6">

              {/* 1 Resume */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">1. Upload Your Resume</p>
                <ResumeUpload onAnalysisComplete={setResumeAnalysis} analysis={resumeAnalysis} />
              </div>

              {/* 2 Role */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">2. Select Target Role</p>
                <Select onValueChange={setSelectedRole} value={selectedRole}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={
                      selectedCompany !== "general"
                        ? `Choose a role at ${COMPANY_LABELS[selectedCompany] ?? "this company"}`
                        : "Choose a role"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    {resumeAnalysis?.recommended_roles?.map(r =>
                      !availableRoles.includes(r) ? (
                        <SelectItem key={r} value={r}>
                          {r} <span className="text-xs text-muted-foreground">(recommended)</span>
                        </SelectItem>
                      ) : null
                    )}
                  </SelectContent>
                </Select>
                {selectedCompany !== "general" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Showing roles typically hired for at {COMPANY_LABELS[selectedCompany]?.replace(" Style", "")}
                  </p>
                )}
              </div>

              {/* 3 Company */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">
                  3. Target Company <span className="font-normal text-muted-foreground">(optional)</span>
                </p>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                  <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Select onValueChange={handleCompanyChange} value={selectedCompany}>
                      <SelectTrigger className="w-full border-0 shadow-none p-0 h-auto focus:ring-0 focus:ring-offset-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {COMPANY_GROUPS.map(group => (
                          <SelectGroup key={group.label}>
                            <SelectLabel>{group.label}</SelectLabel>
                            {group.options.map(c => (
                              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Questions will match this company's interview style
                    </p>
                  </div>
                </div>
              </div>

              {/* 4 Job Description */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">
                  4. Job Description <span className="font-normal text-muted-foreground">(optional)</span>
                </p>
                <Textarea
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  placeholder="Paste a job description to get questions tailored to this exact role's requirements..."
                  className="min-h-[100px] resize-none"
                />
                {jobDescription.trim() && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Questions will prioritize the skills and requirements from this job description
                  </p>
                )}
              </div>

              {/* 5 Voice */}
              {(sttSupported || ttsSupported) && (
                <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Mic className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Browser Voice Mode</p>
                      <p className="text-xs text-muted-foreground">Speak answers &amp; hear AI responses</p>
                    </div>
                  </div>
                  <Switch checked={voiceMode} onCheckedChange={setVoiceMode} />
                </div>
              )}

              <Button
                onClick={startInterview}
                disabled={!selectedRole}
                className="w-full gradient-primary text-primary-foreground border-0 hover:opacity-90"
                size="lg"
              >
                {selectedRole
                  ? `Start Interview${selectedCompany !== "general" ? ` — ${COMPANY_LABELS[selectedCompany]}` : ""}`
                  : "Select a role to continue"}
              </Button>
            </div>
          </motion.div>

        ) : (
          <>
            {/* Top bar */}
            <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-semibold text-foreground">Live Interview</h1>
                <Badge variant="secondary">{selectedRole}</Badge>
                {selectedCompany !== "general" && (
                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                    🏢 {COMPANY_LABELS[selectedCompany]}
                  </Badge>
                )}
                {jobDescription.trim() && (
                  <Badge variant="outline" className="text-xs bg-accent/10 text-accent-foreground border-accent/20">
                    📋 JD-based
                  </Badge>
                )}
                {resumeAnalysis && <Badge variant="outline" className="text-xs">Resume Loaded</Badge>}
                {voiceMode && (
                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-200">
                    🎙 Voice
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                {ttsSupported && (
                  <Button variant="ghost" size="sm" onClick={() => setAutoSpeak(v => !v)}>
                    {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={endInterview}>End Interview</Button>
                <Button variant="ghost" size="sm" onClick={reset}>
                  <RotateCcw className="h-4 w-4 mr-1" /> New
                </Button>
              </div>
            </div>

            {/* Chat */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 rounded-xl border border-border bg-card p-4 min-h-[400px] max-h-[60vh]">
              <AnimatePresence mode="popLayout">
                {messages.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                    {msg.role === "assistant" && (
                      <div className="shrink-0 rounded-full gradient-primary p-2 h-8 w-8 flex items-center justify-center mt-1">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                    <div className={`max-w-[78%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}>
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                      {msg.role === "assistant" && ttsSupported && !isStreaming && (
                        <button
                          onClick={() => isSpeaking ? stopSpeaking() : speak(msg.content)}
                          className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {isSpeaking ? "⏹ Stop" : "🔊 Listen"}
                        </button>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="shrink-0 rounded-full bg-secondary p-2 h-8 w-8 flex items-center justify-center mt-1">
                        <User className="h-4 w-4 text-secondary-foreground" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {isStreaming && messages.length === 0 && (
                <div className="flex gap-3">
                  <div className="shrink-0 rounded-full gradient-primary p-2 h-8 w-8 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Preparing your{selectedCompany !== "general" ? ` ${COMPANY_LABELS[selectedCompany]}` : ""} interview...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2 items-end">
              {voiceMode && sttSupported && (
                <Button
                  onClick={() => isListening ? stopListening() : startListening()}
                  variant={isListening ? "destructive" : "outline"}
                  size="icon"
                  className={`shrink-0 ${isListening ? "animate-pulse" : ""}`}
                  disabled={isStreaming}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={isStreaming ? "AI is responding..." : isListening ? "🎙 Listening..." : "Type your answer... (Enter to send)"}
                className="min-h-[60px] resize-none flex-1"
                disabled={isStreaming}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAnswer(); }
                }}
              />
              <Button
                onClick={sendAnswer}
                disabled={!input.trim() || isStreaming}
                className="gradient-primary text-primary-foreground border-0 hover:opacity-90 shrink-0"
                size="icon"
              >
                {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Interview;