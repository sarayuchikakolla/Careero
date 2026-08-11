// import { useState, useCallback } from "react";
// import { useConversation } from "@elevenlabs/react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Phone, PhoneOff, Loader2, Volume2, Mic } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { useToast } from "@/hooks/use-toast";
// import { supabase } from "@/integrations/supabase/client";

// interface VoiceInterviewProps {
//   role: string;
//   resumeContext?: string;
//   onEnd: () => void;
// }

// const VoiceInterview = ({ role, resumeContext, onEnd }: VoiceInterviewProps) => {
//   const [isConnecting, setIsConnecting] = useState(false);
//   const [transcripts, setTranscripts] = useState<Array<{ speaker: "user" | "agent"; text: string }>>([]);
//   const { toast } = useToast();

//   const conversation = useConversation({
//     onConnect: () => {
//       console.log("Connected to ElevenLabs agent");
//       toast({ title: "Connected", description: "Voice interview started. Speak naturally!" });
//     },
//     onDisconnect: () => {
//       console.log("Disconnected from agent");
//     },
//     onMessage: (message: any) => {
//       if (message.type === "user_transcript") {
//         setTranscripts(prev => [...prev, { speaker: "user", text: message.user_transcription_event?.user_transcript || "" }]);
//       } else if (message.type === "agent_response") {
//         setTranscripts(prev => [...prev, { speaker: "agent", text: message.agent_response_event?.agent_response || "" }]);
//       }
//     },
//     onError: (error: any) => {
//       console.error("Conversation error:", error);
//       toast({ title: "Connection Error", description: "Voice connection failed. Please try again.", variant: "destructive" });
//     },
//   });

//   const startConversation = useCallback(async () => {
//     setIsConnecting(true);
//     try {
//       await navigator.mediaDevices.getUserMedia({ audio: true });

//       const { data, error } = await supabase.functions.invoke("elevenlabs-conversation-token");

//       if (error) {
//         throw new Error(error.message || "Failed to get conversation token");
//       }

//       if (!data?.signed_url && !data?.token) {
//         throw new Error(data?.error || "Failed to get conversation token");
//       }

//       // Use signed URL (WebSocket) if available, otherwise use token (WebRTC)
//       if (data.signed_url) {
//         await conversation.startSession({
//           signedUrl: data.signed_url,
//         });
//       } else if (data.token) {
//         await conversation.startSession({
//           conversationToken: data.token,
//           connectionType: "webrtc" as any,
//         });
//       }
//     } catch (err) {
//       console.error("Failed to start:", err);
//       toast({
//         title: "Failed to connect",
//         description: err instanceof Error ? err.message : "Could not start voice interview",
//         variant: "destructive",
//       });
//     } finally {
//       setIsConnecting(false);
//     }
//   }, [conversation, toast]);

//   const endConversation = useCallback(async () => {
//     await conversation.endSession();
//     onEnd();
//   }, [conversation, onEnd]);

//   const isConnected = conversation.status === "connected";

//   return (
//     <div className="flex flex-col h-full">
//       <div className="mb-4 flex items-center justify-between">
//         <div className="flex items-center gap-3">
//           <h1 className="text-lg font-semibold text-foreground">Voice Interview</h1>
//           <Badge variant="secondary">{role}</Badge>
//           <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
//             🎙 Live Voice
//           </Badge>
//         </div>
//         {isConnected && (
//           <Button variant="destructive" size="sm" onClick={endConversation}>
//             <PhoneOff className="h-4 w-4 mr-1" /> End Call
//           </Button>
//         )}
//       </div>

//       <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-border bg-card p-8">
//         {!isConnected && !isConnecting ? (
//           <motion.div
//             initial={{ opacity: 0, scale: 0.9 }}
//             animate={{ opacity: 1, scale: 1 }}
//             className="text-center space-y-6"
//           >
//             <div className="mx-auto w-24 h-24 rounded-full gradient-primary flex items-center justify-center">
//               <Phone className="h-10 w-10 text-primary-foreground" />
//             </div>
//             <div>
//               <h2 className="text-xl font-semibold text-foreground">Ready to Start</h2>
//               <p className="text-sm text-muted-foreground mt-1">
//                 Click below to begin your real-time voice interview for <strong>{role}</strong>
//               </p>
//             </div>
//             <Button
//               onClick={startConversation}
//               size="lg"
//               className="gradient-primary text-primary-foreground border-0 hover:opacity-90 gap-2"
//             >
//               <Phone className="h-5 w-5" /> Start Voice Call
//             </Button>
//           </motion.div>
//         ) : isConnecting ? (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             className="text-center space-y-4"
//           >
//             <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
//             <p className="text-muted-foreground">Connecting to interviewer...</p>
//           </motion.div>
//         ) : (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             className="w-full max-w-lg text-center space-y-8"
//           >
//             <div className="flex items-center justify-center gap-3">
//               <span className="relative flex h-3 w-3">
//                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
//                 <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
//               </span>
//               <span className="text-sm font-medium text-green-600">Live Call</span>
//             </div>

//             <div className="space-y-4">
//               <AnimatePresence mode="wait">
//                 {conversation.isSpeaking ? (
//                   <motion.div
//                     key="agent-speaking"
//                     initial={{ opacity: 0, scale: 0.9 }}
//                     animate={{ opacity: 1, scale: 1 }}
//                     exit={{ opacity: 0, scale: 0.9 }}
//                     className="space-y-3"
//                   >
//                     <div className="mx-auto w-20 h-20 rounded-full gradient-primary flex items-center justify-center animate-pulse">
//                       <Volume2 className="h-8 w-8 text-primary-foreground" />
//                     </div>
//                     <p className="text-sm font-medium text-foreground">Interviewer is speaking...</p>
//                   </motion.div>
//                 ) : (
//                   <motion.div
//                     key="user-turn"
//                     initial={{ opacity: 0, scale: 0.9 }}
//                     animate={{ opacity: 1, scale: 1 }}
//                     exit={{ opacity: 0, scale: 0.9 }}
//                     className="space-y-3"
//                   >
//                     <div className="mx-auto w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
//                       <Mic className="h-8 w-8 text-secondary-foreground" />
//                     </div>
//                     <p className="text-sm font-medium text-foreground">Your turn — speak naturally</p>
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//             </div>

//             {transcripts.length > 0 && (
//               <div className="max-h-48 overflow-y-auto space-y-2 text-left rounded-lg bg-muted/50 p-4">
//                 {transcripts.slice(-6).map((t, i) => (
//                   <div key={i} className={`text-sm ${t.speaker === "user" ? "text-primary font-medium" : "text-muted-foreground"}`}>
//                     <span className="font-semibold">{t.speaker === "user" ? "You" : "AI"}:</span> {t.text}
//                   </div>
//                 ))}
//               </div>
//             )}

//             <Button variant="destructive" size="lg" onClick={endConversation} className="gap-2">
//               <PhoneOff className="h-5 w-5" /> End Interview
//             </Button>
//           </motion.div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default VoiceInterview;
