/*
 * DESIGN: Neural Noir — Cinematic Intelligence
 * Deep charcoal base + warm amber accents + cyan analysis states
 * Asymmetric hero layout, frosted glass panels, animated waveform
 */
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Mic, Brain, Eye, Ear, MessageSquare,
  Zap, Shield, Clock, ArrowRight, Play, Sparkles,
  Video, FileAudio, Search, ChevronDown
} from "lucide-react";

const HERO_BG = "https://private-us-east-1.manuscdn.com/sessionFile/gWmyXpFEvHo0kObvks0qCF/sandbox/ZtI9hC7CC6zZ9rytJNsjtt-img-1_1771449548000_na1fn_aGVyby1iZw.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvZ1dteVhwRkV2SG8wa09idmtzMHFDRi9zYW5kYm94L1p0STloQzdDQzZ6WjlyeXRKTnNqdHQtaW1nLTFfMTc3MTQ0OTU0ODAwMF9uYTFmbl9hR1Z5YnkxaVp3LnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=LmFPP5CLRtN1EFQZJV1W3nIBizPvNYTZiT-FQpuGuU-u9J4ArLgWSL9jJ-68b51RyivsaG9oUZ3uZ~ba4jCk3B1lZ6ISqOtHKrQlmEPiPuEg569J54Pa6In4pFidVCKR3q954dSxtEr9~tgXtJ8sMkAHipGWsQinxX~bVCSjyUBFO2ouilsPNXzTuioHD6QA4MHk4Z3w-DV8MqiQpuzE7WkHSY7fBZBNuZoc8JEYkLMShkJRM7xeGEo2B~tF69LUooeyTDyM6ebBE9hGNwsSE9MVn7Ur6B~-53MwoABK8itbECoI3jL7iFugKxKiK9IzqB-ZVyFvO-bJeOOxGbdpfA__";

const WAVEFORM_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/gWmyXpFEvHo0kObvks0qCF/sandbox/ZtI9hC7CC6zZ9rytJNsjtt-img-3_1771449548000_na1fn_d2F2ZWZvcm0tZ2xvdw.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvZ1dteVhwRkV2SG8wa09idmtzMHFDRi9zYW5kYm94L1p0STloQzdDQzZ6WjlyeXRKTnNqdHQtaW1nLTNfMTc3MTQ0OTU0ODAwMF9uYTFmbl9kMkYyWldadmNtMHRaMnh2ZHcucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=XA5b5J~BWBxz4LN8E5XKK~1ESpUjkNriin3j7b0IpWJ38CPulQ--JXzrEW3dU0TQbUVpFDM3aRxBp8mQUvGbmkeuSId5jc1KSwiL7o-Ge6gjfeefFHrvarJ5Bg2NY9h7YXEZljPCg6lhxc2IvCXPp-MCTD4Rutqj7lr7z5Uu0nPuvhDvD5gRpEsyezYZylSk9pBDh7No3phlGwZquhvCQQf0DR0PQjmfCnHCdFkCN5RTOKXPk1~AayfiZMthiAvkEJ7cLl4GWVeu8Aa2soikvOU9pgWkFEeGirWXJZZrq20MHrwdhLvn6AoBJDDmWHEJqlIL6YqX13ciFTLRW~bOlA__";

const VIDEO_UPLOAD_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/gWmyXpFEvHo0kObvks0qCF/sandbox/ZtI9hC7CC6zZ9rytJNsjtt-img-5_1771449548000_na1fn_dmlkZW8tdXBsb2FkLWlsbHVzdHJhdGlvbg.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvZ1dteVhwRkV2SG8wa09idmtzMHFDRi9zYW5kYm94L1p0STloQzdDQzZ6WjlyeXRKTnNqdHQtaW1nLTVfMTc3MTQ0OTU0ODAwMF9uYTFmbl9kbWxrWlc4dGRYQnNiMkZrTFdsc2JIVnpkSEpoZEdsdmJnLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=MCT4bWoz-aocZbko8j452ybUXbMncIbfAoifc3FCWjpng-NbllU4u0xKDV7AW3sbFNQX4IpfbCLYHKWV9js~M7JcGTi74rJXD8JqJabeSjo1qzOuARv5vYZCmTFd4YvXD2ELuM8MA-awXQtv5dOQXqF0xfNQpZLamze21uxj39yjXk8Ft2W-2FVsmLnfA58jTty9NO59BNDcuWSlAmPiSHH23RoZhNiN4GAPe3VVypnfAD9BdcjS37-2npIm~j7lKpJaOnDRFUDFJDquFK~Fyoq1veT46mpZv~1rCmSuE-2EU1k3djx4uC5CY5NhrKjpgX8FuUm7rHFUv4MMiyiweA__";

const AVATAR_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/gWmyXpFEvHo0kObvks0qCF/sandbox/ZtI9hC7CC6zZ9rytJNsjtt-img-4_1771449544000_na1fn_ZWxsaWUtYXZhdGFy.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvZ1dteVhwRkV2SG8wa09idmtzMHFDRi9zYW5kYm94L1p0STloQzdDQzZ6WjlyeXRKTnNqdHQtaW1nLTRfMTc3MTQ0OTU0NDAwMF9uYTFmbl9aV3hzYVdVdFlYWmhkR0Z5LnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=SIRRSC92Ni0xdTZyZCjSHoudn50ifXmKQh8APzVgJOj1y0Y8Pl04pWjvFdmsvonU9poFlKHq6QPozjLP277Yac9dZvDj8ftxO25LPVBkWAJGxczpMilQGhr~VIuql07swEEO56cjUihwh4R2shJ4X-Fntq9BlthIGzXEigdDgQksxQDNXfHs8TteURZ~Eq2ECDt6caEkCl4FluUVkoEWJ3Tt2GNjBMXxnF~EtE9a1ipuNVLHvcfYJEn--Q6pXicClMkB4zYo2gsr1HAK61siQBdvWS87XnR9xBJ8lRFm0nAQAwUaP-tjpp8eToyDWl0wahj5pvq1-Rtmdk02Zhs3aw__";

/* ---- Animated waveform bars component ---- */
function WaveformBars({ active }: { active: boolean }) {
  const bars = 24;
  return (
    <div className="flex items-center justify-center gap-[3px] h-12">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full transition-all duration-300"
          style={{
            height: active ? `${12 + Math.sin(i * 0.7) * 20 + Math.random() * 16}px` : '4px',
            background: active
              ? `linear-gradient(to top, oklch(0.82 0.15 75), oklch(0.78 0.12 195))`
              : 'oklch(0.3 0.01 270)',
            animationDelay: `${i * 50}ms`,
            animation: active ? `waveformPulse ${0.8 + Math.random() * 0.8}s ease-in-out infinite` : 'none',
          }}
        />
      ))}
    </div>
  );
}

/* ---- Floating particles ---- */
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: i % 3 === 0 ? 'oklch(0.82 0.15 75 / 30%)' : 'oklch(0.78 0.12 195 / 20%)',
            animation: `float ${4 + Math.random() * 6}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ---- Feature card ---- */
function FeatureCard({ icon: Icon, title, description, delay }: {
  icon: React.ElementType; title: string; description: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
      className="glass-panel rounded-xl p-6 hover:border-amber/20 transition-all duration-500 group"
    >
      <div className="w-11 h-11 rounded-lg bg-amber/10 flex items-center justify-center mb-4 group-hover:glow-amber transition-all duration-500">
        <Icon className="w-5 h-5 text-amber" />
      </div>
      <h3 className="font-display text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}

/* ---- Stat card ---- */
function StatCard({ value, label, suffix }: { value: string; label: string; suffix?: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-4xl lg:text-5xl font-bold text-amber text-glow-amber">
        {value}<span className="text-cyan text-2xl lg:text-3xl">{suffix}</span>
      </div>
      <div className="text-sm text-muted-foreground mt-2 font-body">{label}</div>
    </div>
  );
}

/* ---- Capability pill ---- */
function CapabilityPill({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-sm text-foreground/80 hover:text-amber hover:border-amber/20 transition-all duration-300">
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN HOME PAGE
   ════════════════════════════════════════════════════════════════ */
export default function Home() {
  const [, navigate] = useLocation();
  const [waveActive, setWaveActive] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setWaveActive(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* ── NAVIGATION ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-panel-solid">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src={AVATAR_IMG} alt="Ellie AI" className="w-9 h-9 rounded-lg" />
              <span className="font-display text-lg font-bold text-foreground">
                Ellie<span className="text-amber">AI</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#capabilities" className="text-sm text-muted-foreground hover:text-amber transition-colors">Capabilities</a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-amber transition-colors">How It Works</a>
              <a href="#features" className="text-sm text-muted-foreground hover:text-amber transition-colors">Features</a>
            </div>
            <Button
              onClick={() => navigate("/analyze")}
              className="bg-amber text-background font-semibold hover:bg-amber/90 transition-all duration-300 glow-amber"
              size="sm"
            >
              Launch Agent
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="relative min-h-screen flex items-center pt-16">
        {/* Background */}
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        </div>
        <FloatingParticles />

        <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left: Text content */}
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel text-xs text-amber mb-6">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="font-medium">State-of-the-Art Video Intelligence</span>
                </div>

                <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
                  <span className="text-foreground">See Everything.</span>
                  <br />
                  <span className="text-amber text-glow-amber">Understand Everything.</span>
                </h1>

                <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mb-8 font-body">
                  Upload any video. Ask anything. Ellie instantly analyzes every frame,
                  transcribes every word, detects every sound, and remembers every detail
                  — then talks to you about it.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-10">
                  <Button
                    onClick={() => navigate("/analyze")}
                    size="lg"
                    className="bg-amber text-background font-bold text-base px-8 py-6 hover:bg-amber/90 glow-amber-strong transition-all duration-300"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Upload & Analyze
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-border/50 text-foreground font-semibold text-base px-8 py-6 hover:border-amber/30 hover:text-amber transition-all duration-300 bg-transparent"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Watch Demo
                  </Button>
                </div>

                {/* Capability pills */}
                <div className="flex flex-wrap gap-2">
                  <CapabilityPill icon={Eye} label="Frame Captioning" />
                  <CapabilityPill icon={Ear} label="Audio Transcription" />
                  <CapabilityPill icon={Brain} label="Conversational Memory" />
                  <CapabilityPill icon={Mic} label="Voice Interaction" />
                  <CapabilityPill icon={Search} label="Instant Search" />
                </div>
              </motion.div>
            </div>

            {/* Right: Visual showcase */}
            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                {/* Main visual card */}
                <div className="glass-panel rounded-2xl p-6 border-gradient">
                  <div className="aspect-video rounded-xl overflow-hidden mb-4 relative bg-black/40">
                    <img src={VIDEO_UPLOAD_IMG} alt="Video Analysis" className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-amber/20 backdrop-blur-sm flex items-center justify-center border border-amber/30 pulse-ring">
                        <Play className="w-7 h-7 text-amber ml-1" />
                      </div>
                    </div>
                  </div>

                  {/* Waveform visualization */}
                  <div className="mb-4">
                    <WaveformBars active={waveActive} />
                  </div>

                  {/* Analysis tags */}
                  <div className="flex flex-wrap gap-2">
                    {["Scene: Office meeting", "Speaker: 2 detected", "Emotion: Engaged"].map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-md font-mono"
                        style={{
                          background: i === 0 ? 'oklch(0.82 0.15 75 / 10%)' : i === 1 ? 'oklch(0.78 0.12 195 / 10%)' : 'oklch(0.7 0.14 150 / 10%)',
                          color: i === 0 ? 'oklch(0.82 0.15 75)' : i === 1 ? 'oklch(0.78 0.12 195)' : 'oklch(0.7 0.14 150)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Floating metric cards */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="absolute -left-6 top-1/4 glass-panel-solid rounded-lg px-3 py-2 hidden lg:block"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber" />
                    <span className="text-xs font-mono text-amber">312ms</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">Response time</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="absolute -right-4 bottom-1/4 glass-panel-solid rounded-lg px-3 py-2 hidden lg:block"
                >
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-cyan" />
                    <span className="text-xs font-mono text-cyan">99.2%</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">Accuracy</div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="w-6 h-6 text-muted-foreground/50" />
        </motion.div>
      </section>

      {/* ── STATS BAND ── */}
      <section className="relative py-20 border-y border-border/30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCard value="<500" suffix="ms" label="End-to-End Latency" />
            <StatCard value="60" suffix="fps" label="Frame Analysis Rate" />
            <StatCard value="99.2" suffix="%" label="Transcription Accuracy" />
            <StatCard value="∞" label="Conversational Memory" />
          </div>
        </div>
      </section>

      {/* ── CAPABILITIES SECTION ── */}
      <section id="capabilities" className="relative py-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Every Sense. <span className="text-amber">One Agent.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ellie doesn't just watch your videos — she sees, hears, understands, and remembers.
              A complete multimodal analysis pipeline in one conversation.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard icon={Eye} title="Frame Captioning" description="Every frame analyzed with Gemini Vision. Scene descriptions, object detection, text extraction, and visual context — all indexed and searchable." delay={0} />
            <FeatureCard icon={Ear} title="Audio Transcription" description="Whisper-powered speech-to-text with speaker diarization. Every word captured with timestamps, speaker labels, and confidence scores." delay={0.06} />
            <FeatureCard icon={FileAudio} title="Audio Detection" description="Sound event detection beyond speech. Music, ambient noise, emotional tone, and environmental audio classified and timestamped." delay={0.12} />
            <FeatureCard icon={Brain} title="Conversational Memory" description="Tiered memory system — short-term, working, and long-term. Ellie remembers your previous questions and builds on past analysis." delay={0.18} />
            <FeatureCard icon={Mic} title="Voice Interaction" description="Talk to Ellie naturally. Sub-500ms voice response with streaming STT, intelligent endpointing, and empathetic TTS synthesis." delay={0.24} />
            <FeatureCard icon={Video} title="Instant Analysis" description="Upload any video format. Parallel processing pipeline extracts frames, audio, and metadata simultaneously for near-instant results." delay={0.3} />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="relative py-24 border-t border-border/30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Three Steps to <span className="text-cyan text-glow-cyan">Intelligence</span>
            </h2>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Upload", description: "Drag and drop any video. MP4, MOV, AVI, WebM — we handle it all. No size limits, no format restrictions.", icon: Upload, color: "amber" },
              { step: "02", title: "Analyze", description: "Our parallel pipeline extracts frames, transcribes audio, detects scenes, and builds a complete understanding in seconds.", icon: Zap, color: "cyan" },
              { step: "03", title: "Converse", description: "Ask anything about your video. Type or speak. Ellie responds with precise answers, timestamps, and visual references.", icon: MessageSquare, color: "amber" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="relative"
              >
                <div className="glass-panel rounded-2xl p-8 h-full border-gradient">
                  <div className="font-mono text-xs text-muted-foreground mb-4">STEP {item.step}</div>
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: item.color === 'amber' ? 'oklch(0.82 0.15 75 / 10%)' : 'oklch(0.78 0.12 195 / 10%)' }}
                  >
                    <item.icon className="w-7 h-7" style={{ color: item.color === 'amber' ? 'oklch(0.82 0.15 75)' : 'oklch(0.78 0.12 195)' }} />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
                {i < 2 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 text-center">
                    <ArrowRight className="w-5 h-5 text-muted-foreground/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section id="features" className="relative py-24 border-t border-border/30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-6">
                  Built for <span className="text-amber">Enterprise</span> Speed
                </h2>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  Every component is optimized for the lowest possible latency.
                  Streaming architecture, intelligent caching, and parallel processing
                  ensure Ellie responds before you finish your thought.
                </p>
              </motion.div>

              <div className="space-y-4">
                {[
                  { icon: Zap, title: "Streaming Pipeline", desc: "20ms audio chunks, parallel STT/LLM/TTS processing" },
                  { icon: Shield, title: "Circuit Breaker", desc: "Automatic failover between AI providers for 99.99% uptime" },
                  { icon: Clock, title: "Predictive Processing", desc: "Starts generating responses on partial transcripts" },
                  { icon: Brain, title: "Intelligent Routing", desc: "Fast models for simple queries, powerful models for complex analysis" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-4 p-4 rounded-xl hover:bg-secondary/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-amber/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-amber" />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-foreground">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img
                src={WAVEFORM_IMG}
                alt="Voice waveform visualization"
                className="w-full rounded-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent rounded-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="relative py-24 border-t border-border/30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl lg:text-6xl font-bold text-foreground mb-6">
              Ready to See <span className="text-amber text-glow-amber">Everything</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Upload your first video and experience the most advanced AI video analysis agent ever built.
            </p>
            <Button
              onClick={() => navigate("/analyze")}
              size="lg"
              className="bg-amber text-background font-bold text-lg px-12 py-7 hover:bg-amber/90 glow-amber-strong transition-all duration-300"
            >
              Launch Ellie AI
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border/30 py-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={AVATAR_IMG} alt="Ellie AI" className="w-6 h-6 rounded" />
              <span className="text-sm text-muted-foreground">Ellie AI — Video Analysis Agent</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Built with Gemini, Whisper, and streaming architecture
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
