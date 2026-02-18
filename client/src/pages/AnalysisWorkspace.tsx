/*
 * DESIGN: Neural Noir — Cinematic Intelligence
 * The main analysis workspace: video upload, playback, AI chat, and analysis panels
 * Split-panel asymmetric layout with frosted glass panels
 * FULLY CONNECTED to tRPC backend — real AI analysis, real chat, real voice
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Streamdown } from "streamdown";
import {
  Upload, Mic, MicOff, Send, ArrowLeft, Play, Pause,
  Eye, Ear, Brain, MessageSquare, FileText,
  Volume2, VolumeX, Maximize2, SkipBack, SkipForward,
  Sparkles, Loader2, Zap
} from "lucide-react";

const AVATAR_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/gWmyXpFEvHo0kObvks0qCF/sandbox/ZtI9hC7CC6zZ9rytJNsjtt-img-4_1771449544000_na1fn_ZWxsaWUtYXZhdGFy.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvZ1dteVhwRkV2SG8wa09idmtzMHFDRi9zYW5kYm94L1p0STloQzdDQzZ6WjlyeXRKTnNqdHQtaW1nLTRfMTc3MTQ0OTU0NDAwMF9uYTFmbl9aV3hzYVdVdFlYWmhkR0Z5LnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=SIRRSC92Ni0xdTZyZCjSHoudn50ifXmKQh8APzVgJOj1y0Y8Pl04pWjvFdmsvonU9poFlKHq6QPozjLP277Yac9dZvDj8ftxO25LPVBkWAJGxczpMilQGhr~VIuql07swEEO56cjUihwh4R2shJ4X-Fntq9BlthIGzXEigdDgQksxQDNXfHs8TteURZ~Eq2ECDt6caEkCl4FluUVkoEWJ3Tt2GNjBMXxnF~EtE9a1ipuNVLHvcfYJEn--Q6pXicClMkB4zYo2gsr1HAK61siQBdvWS87XnR9xBJ8lRFm0nAQAwUaP-tjpp8eToyDWl0wahj5pvq1-Rtmdk02Zhs3aw__";

const VIDEO_UPLOAD_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/gWmyXpFEvHo0kObvks0qCF/sandbox/ZtI9hC7CC6zZ9rytJNsjtt-img-5_1771449548000_na1fn_dmlkZW8tdXBsb2FkLWlsbHVzdHJhdGlvbg.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvZ1dteVhwRkV2SG8wa09idmtzMHFDRi9zYW5kYm94L1p0STloQzdDQzZ6WjlyeXRKTnNqdHQtaW1nLTVfMTc3MTQ0OTU0ODAwMF9uYTFmbl9kbWxrWlc4dGRYQnNiMkZrTFdsc2JIVnpkSEpoZEdsdmJnLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=MCT4bWoz-aocZbko8j452ybUXbMncIbfAoifc3FCWjpng-NbllU4u0xKDV7AW3sbFNQX4IpfbCLYHKWV9js~M7JcGTi74rJXD8JqJabeSjo1qzOuARv5vYZCmTFd4YvXD2ELuM8MA-awXQtv5dOQXqF0xfNQpZLamze21uxj39yjXk8Ft2W-2FVsmLnfA58jTty9NO59BNDcuWSlAmPiSHH23RoZhNiN4GAPe3VVypnfAD9BdcjS37-2npIm~j7lKpJaOnDRFUDFJDquFK~Fyoq1veT46mpZv~1rCmSuE-2EU1k3djx4uC5CY5NhrKjpgX8FuUm7rHFUv4MMiyiweA__";

/* ── Types ── */
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "text" | "voice";
}

interface AnalysisResultItem {
  id?: number;
  type: string;
  timestamp: number;
  content: string;
  confidence: number;
}

/* ── Waveform Visualizer ── */
function VoiceWaveform({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-[2px] h-8">
      {Array.from({ length: 16 }).map((_, i) => (
        <div
          key={i}
          className="w-[2.5px] rounded-full transition-all"
          style={{
            height: active ? `${6 + Math.random() * 22}px` : '4px',
            background: active ? 'oklch(0.82 0.15 75)' : 'oklch(0.3 0.01 270)',
            animation: active ? `waveformPulse ${0.6 + Math.random() * 0.6}s ease-in-out infinite` : 'none',
            animationDelay: `${i * 40}ms`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Upload Zone ── */
function UploadZone({ onUpload, isUploading }: { onUpload: (file: File) => void; isUploading: boolean }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      onUpload(file);
    } else {
      toast.error("Please upload a video file");
    }
  }, [onUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  }, [onUpload]);

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`
          w-full max-w-xl rounded-2xl border-2 border-dashed transition-all duration-300 p-12 text-center cursor-pointer
          ${isDragging
            ? 'border-amber bg-amber/5 glow-amber'
            : 'border-border/50 hover:border-amber/30 hover:bg-secondary/20'
          }
          ${isUploading ? 'pointer-events-none opacity-60' : ''}
        `}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
        {isUploading ? (
          <>
            <Loader2 className="w-16 h-16 mx-auto text-amber animate-spin mb-6" />
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">Uploading & Analyzing...</h3>
            <p className="text-sm text-muted-foreground">This may take a moment. Ellie is processing your video with AI.</p>
          </>
        ) : (
          <>
            <div className="mb-6">
              <img src={VIDEO_UPLOAD_IMG} alt="" className="w-32 h-32 mx-auto opacity-60 rounded-xl" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">Drop your video here</h3>
            <p className="text-sm text-muted-foreground mb-6">or click to browse — MP4, MOV, AVI, WebM supported</p>
            <Button variant="outline" className="border-amber/30 text-amber hover:bg-amber/10">
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}

/* ── Video Player ── */
function VideoPlayer({ videoUrl, videoName }: { videoUrl: string; videoName: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="relative flex-1 bg-black rounded-xl overflow-hidden group">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
          onEnded={() => setIsPlaying(false)}
          muted={isMuted}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div
              className="w-full h-1 bg-white/20 rounded-full mb-3 cursor-pointer"
              onClick={(e) => {
                if (!videoRef.current) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                videoRef.current.currentTime = pct * duration;
              }}
            >
              <div className="h-full bg-amber rounded-full transition-all" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 10; }} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                  <SkipBack className="w-4 h-4 text-white" />
                </button>
                <button onClick={togglePlay} className="p-2 bg-amber/20 hover:bg-amber/30 rounded-lg transition-colors">
                  {isPlaying ? <Pause className="w-5 h-5 text-amber" /> : <Play className="w-5 h-5 text-amber ml-0.5" />}
                </button>
                <button onClick={() => { if (videoRef.current) videoRef.current.currentTime += 10; }} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                  <SkipForward className="w-4 h-4 text-white" />
                </button>
                <span className="text-xs font-mono text-white/70 ml-2">{formatTime(currentTime)} / {formatTime(duration)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsMuted(!isMuted)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                  {isMuted ? <VolumeX className="w-4 h-4 text-white/70" /> : <Volume2 className="w-4 h-4 text-white/70" />}
                </button>
                <button onClick={() => videoRef.current?.requestFullscreen()} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                  <Maximize2 className="w-4 h-4 text-white/70" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between px-3 py-2 mt-2">
        <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">{videoName}</span>
        <span className="text-xs text-muted-foreground font-mono">{formatTime(duration)}</span>
      </div>
    </div>
  );
}

/* ── Analysis Panel ── */
function AnalysisPanel({ results, isAnalyzing }: { results: AnalysisResultItem[]; isAnalyzing: boolean }) {
  const typeIcons: Record<string, React.ElementType> = {
    frame: Eye, transcript: FileText, audio: Ear, scene: Sparkles, emotion: Brain, summary: MessageSquare,
  };
  const typeColors: Record<string, string> = {
    frame: 'oklch(0.82 0.15 75)', transcript: 'oklch(0.78 0.12 195)', audio: 'oklch(0.7 0.14 150)',
    scene: 'oklch(0.65 0.18 300)', emotion: 'oklch(0.8 0.15 30)', summary: 'oklch(0.82 0.15 75)',
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <h3 className="font-display text-sm font-semibold text-foreground">Analysis Results</h3>
        {isAnalyzing && (
          <div className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 text-amber animate-spin" />
            <span className="text-xs text-amber font-mono">Analyzing...</span>
          </div>
        )}
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {results.length === 0 && !isAnalyzing && (
            <div className="text-center py-12 text-muted-foreground text-sm">Analysis results will appear here after upload</div>
          )}
          {isAnalyzing && results.length === 0 && (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (<div key={i} className="shimmer h-16 rounded-lg" />))}
            </div>
          )}
          {results.map((result, i) => {
            const Icon = typeIcons[result.type] || Sparkles;
            const color = typeColors[result.type] || typeColors.scene;
            return (
              <motion.div key={result.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="glass-panel rounded-lg p-3 hover:border-amber/10 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono uppercase" style={{ color }}>{result.type}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {Math.floor(result.timestamp / 60)}:{Math.floor(result.timestamp % 60).toString().padStart(2, '0')}
                      </span>
                      {result.confidence > 0 && (
                        <span className="text-[10px] text-muted-foreground font-mono">{Math.round(result.confidence * 100)}%</span>
                      )}
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">{result.content}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

/* ── Chat Interface ── */
function ChatInterface({ videoId, messages, setMessages }: {
  videoId: number;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}) {
  const [input, setInput] = useState("");
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const chatMutation = trpc.chat.send.useMutation();
  const voiceMutation = trpc.voice.transcribe.useMutation();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isThinking]);

  const sendMessage = useCallback(async (content: string, type: "text" | "voice" = "text") => {
    if (!content.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
      type,
    };
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const response = await chatMutation.mutateAsync({
        videoId,
        message: content.trim(),
        messageType: type,
      });

      const aiMsg: ChatMessage = {
        id: response.id,
        role: "assistant",
        content: response.content,
        timestamp: new Date(response.timestamp),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      toast.error("Failed to get response. Please try again.");
      console.error("[Chat] Error:", error);
    } finally {
      setIsThinking(false);
    }
  }, [videoId, chatMutation, setMessages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(",")[1];
          try {
            toast.info("Transcribing your voice...");
            const result = await voiceMutation.mutateAsync({ audioData: base64, mimeType: "audio/webm" });
            if (result.text) {
              sendMessage(result.text, "voice");
            } else {
              toast.error("Could not understand the audio. Please try again.");
            }
          } catch {
            toast.error("Voice transcription failed. Please try typing instead.");
          }
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Listening... Speak now");
    } catch {
      toast.error("Microphone access denied. Please allow microphone access.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <img src={AVATAR_IMG} alt="Ellie" className="w-6 h-6 rounded" />
          <h3 className="font-display text-sm font-semibold text-foreground">Ask Ellie</h3>
        </div>
        <button
          onClick={() => setIsVoiceMode(!isVoiceMode)}
          className={`p-1.5 rounded-md transition-colors ${isVoiceMode ? 'bg-amber/10 text-amber' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Mic className="w-4 h-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <img src={AVATAR_IMG} alt="Ellie" className="w-16 h-16 rounded-xl mx-auto mb-4 opacity-60" />
            <p className="text-sm text-muted-foreground mb-4">Upload a video and ask me anything about it.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {["What happens in this video?", "Summarize the key points", "Who is speaking?", "What emotions are shown?"].map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)}
                  className="text-xs px-3 py-1.5 rounded-full glass-panel text-muted-foreground hover:text-amber hover:border-amber/20 transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'assistant' ? 'flex items-start gap-2' : ''}`}>
              {msg.role === 'assistant' && (
                <img src={AVATAR_IMG} alt="Ellie" className="w-7 h-7 rounded shrink-0 mt-0.5" />
              )}
              <div className={`rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user' ? 'bg-amber/15 text-foreground' : 'glass-panel text-foreground/90'
              }`}>
                {msg.role === 'assistant' ? <Streamdown>{msg.content}</Streamdown> : msg.content}
              </div>
            </div>
          </motion.div>
        ))}

        {isThinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2">
            <img src={AVATAR_IMG} alt="Ellie" className="w-7 h-7 rounded shrink-0" />
            <div className="glass-panel rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-amber animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-amber animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="p-3 border-t border-border/30">
        {isVoiceMode ? (
          <div className="flex items-center justify-center gap-4 py-2">
            <VoiceWaveform active={isRecording} />
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                isRecording ? 'bg-red-500/20 text-red-400 pulse-ring' : 'bg-amber/10 text-amber hover:bg-amber/20'
              }`}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <VoiceWaveform active={isRecording} />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask about the video..."
              disabled={isThinking}
              className="flex-1 bg-secondary/50 border border-border/30 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber/30 focus:ring-1 focus:ring-amber/20 transition-all disabled:opacity-50"
            />
            <Button onClick={handleSend} disabled={!input.trim() || isThinking} size="icon"
              className="bg-amber text-background hover:bg-amber/90 disabled:opacity-30 rounded-xl w-10 h-10">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN WORKSPACE
   ════════════════════════════════════════════════════════════════ */
export default function AnalysisWorkspace() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResultItem[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState("chat");
  const [responseTime, setResponseTime] = useState<number | null>(null);

  const uploadMutation = trpc.video.upload.useMutation();
  const analyzeMutation = trpc.analysis.analyze.useMutation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  const handleUpload = useCallback(async (file: File) => {
    setVideoFile(file);
    const localUrl = URL.createObjectURL(file);
    setVideoUrl(localUrl);
    setIsUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      toast.info("Uploading video to cloud...");

      // Upload to server
      const uploadResult = await uploadMutation.mutateAsync({
        filename: file.name,
        mimeType: file.type,
        data: base64Data,
        fileSize: file.size,
      });

      setVideoId(uploadResult.videoId);
      toast.success("Upload complete! Starting AI analysis...");

      // Start analysis
      setIsUploading(false);
      setIsAnalyzing(true);
      const startTime = Date.now();

      const analysisResult = await analyzeMutation.mutateAsync({
        videoId: uploadResult.videoId,
      });

      setResponseTime(Date.now() - startTime);

      if (analysisResult.results) {
        setAnalysisResults(analysisResult.results.map((r: AnalysisResultItem, i: number) => ({ ...r, id: i })));
      }

      setIsAnalyzing(false);
      toast.success("Analysis complete!", { description: `${analysisResult.results?.length || 0} insights extracted` });
    } catch (error) {
      console.error("[Upload] Error:", error);
      setIsUploading(false);
      setIsAnalyzing(false);
      toast.error("Upload or analysis failed. Please try again.");
    }
  }, [uploadMutation, analyzeMutation]);

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-amber animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* ── Top Bar ── */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-border/30 shrink-0 glass-panel-solid">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2">
            <img src={AVATAR_IMG} alt="Ellie" className="w-6 h-6 rounded" />
            <span className="font-display text-sm font-semibold text-foreground">Ellie<span className="text-amber">AI</span></span>
          </div>
          {videoFile && (
            <>
              <Separator orientation="vertical" className="h-5" />
              <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">{videoFile.name}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(isUploading || isAnalyzing) && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber/10">
              <Loader2 className="w-3.5 h-3.5 text-amber animate-spin" />
              <span className="text-xs text-amber font-mono">{isUploading ? 'Uploading' : 'Analyzing'}</span>
            </div>
          )}
          {responseTime && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/50">
              <Zap className="w-3 h-3 text-amber" />
              <span className="text-[10px] font-mono text-muted-foreground">{(responseTime / 1000).toFixed(1)}s</span>
            </div>
          )}
          {user && (
            <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-secondary/50">
              <span className="text-[10px] font-mono text-muted-foreground">{user.name || user.email || 'User'}</span>
            </div>
          )}
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="flex-1 flex overflow-hidden">
        {!videoFile ? (
          <UploadZone onUpload={handleUpload} isUploading={isUploading} />
        ) : (
          <>
            {/* Left Panel: Video Player */}
            <div className="w-[55%] flex flex-col p-4 border-r border-border/30">
              <VideoPlayer videoUrl={videoUrl!} videoName={videoFile.name} />
            </div>

            {/* Right Panel: Tabs */}
            <div className="w-[45%] flex flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                <TabsList className="h-11 rounded-none border-b border-border/30 bg-transparent px-2 shrink-0">
                  <TabsTrigger value="chat" className="data-[state=active]:bg-amber/10 data-[state=active]:text-amber rounded-lg text-xs">
                    <MessageSquare className="w-3.5 h-3.5 mr-1.5" />Chat
                  </TabsTrigger>
                  <TabsTrigger value="analysis" className="data-[state=active]:bg-cyan/10 data-[state=active]:text-cyan rounded-lg text-xs">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />Analysis
                    {analysisResults.length > 0 && (
                      <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-cyan/10 text-cyan">{analysisResults.length}</span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="transcript" className="data-[state=active]:bg-secondary data-[state=active]:text-foreground rounded-lg text-xs">
                    <FileText className="w-3.5 h-3.5 mr-1.5" />Transcript
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="flex-1 m-0 overflow-hidden">
                  {videoId ? (
                    <ChatInterface videoId={videoId} messages={chatMessages} setMessages={setChatMessages} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      Waiting for video upload to complete...
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="analysis" className="flex-1 m-0 overflow-hidden">
                  <AnalysisPanel results={analysisResults} isAnalyzing={isAnalyzing} />
                </TabsContent>

                <TabsContent value="transcript" className="flex-1 m-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-3">
                      {analysisResults.filter(r => r.type === 'transcript').length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground text-sm">
                          {isAnalyzing ? 'Extracting transcript...' : 'Transcript will appear here after analysis'}
                        </div>
                      ) : (
                        analysisResults.filter(r => r.type === 'transcript').map((r, i) => (
                          <div key={i} className="flex items-start gap-3 py-2">
                            <span className="text-xs font-mono text-amber shrink-0 mt-0.5 w-10">
                              {Math.floor(r.timestamp / 60)}:{Math.floor(r.timestamp % 60).toString().padStart(2, '0')}
                            </span>
                            <p className="text-sm text-foreground/80 leading-relaxed">{r.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
