import { Link } from "wouter";
import {
  ArrowLeft,
  Brain,
  Database,
  HeartPulse,
  Lock,
  Server,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const stack = [
  {
    icon: Brain,
    title: "Multimodal AI pipeline",
    body: "Ellie ingests uploaded video, extracts searchable metadata, stores analysis results, and exposes the workflow through a typed tRPC backend.",
  },
  {
    icon: Database,
    title: "Persistent data layer",
    body: "Drizzle ORM maps users, videos, and timestamped analysis records into a MySQL-compatible database so the product can evolve beyond demo state.",
  },
  {
    icon: HeartPulse,
    title: "Operational readiness",
    body: "The backend now exposes /api/health and /api/readiness for platform probes, dependency checks, and production release gates.",
  },
  {
    icon: Lock,
    title: "Security baseline",
    body: "The Express server disables framework fingerprints and applies content, referrer, frame, MIME, and permissions policies before serving APIs or assets.",
  },
];

const backendCapabilities = [
  "Video upload metadata and lifecycle state management",
  "Timestamped AI analysis result persistence",
  "Owner-ready session and OAuth integration hooks",
  "Forge-compatible AI, transcription, and storage proxy configuration",
  "Environment validation for release and deployment gates",
  "Container healthcheck support for production hosting",
];

export default function About() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border/30 bg-secondary/20">
        <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
          <Button
            asChild
            variant="ghost"
            className="mb-8 text-muted-foreground hover:text-amber"
          >
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Ellie
            </Link>
          </Button>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-amber/20 bg-amber/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber">
                Production application brief
              </p>
              <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                Ellie AI is a full-stack video intelligence workspace.
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
                Ellie is designed to move from a cinematic AI demo into an
                operable product: a React application backed by an Express/tRPC
                service, Drizzle-managed persistence, AI/storage integrations,
                and release gates that make the backend observable before
                deployment.
              </p>
            </div>

            <div className="rounded-2xl border border-border/40 bg-background/70 p-6 shadow-2xl shadow-black/20">
              <div className="mb-4 flex items-center gap-3 text-amber">
                <Server className="h-5 w-5" />
                <span className="font-semibold">Backend status surfaces</span>
              </div>
              <div className="grid gap-3 text-sm text-muted-foreground">
                <code className="rounded-lg bg-secondary/60 px-3 py-2 text-foreground">
                  GET /api/health
                </code>
                <code className="rounded-lg bg-secondary/60 px-3 py-2 text-foreground">
                  GET /api/readiness
                </code>
                <code className="rounded-lg bg-secondary/60 px-3 py-2 text-foreground">
                  POST /api/trpc/*
                </code>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2">
          {stack.map(item => (
            <article
              key={item.title}
              className="rounded-2xl border border-border/40 bg-secondary/20 p-6"
            >
              <item.icon className="mb-4 h-7 w-7 text-amber" />
              <h2 className="font-display text-2xl font-semibold">
                {item.title}
              </h2>
              <p className="mt-3 leading-7 text-muted-foreground">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border/30 bg-secondary/20">
        <div className="mx-auto grid max-w-[1180px] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <UploadCloud className="mb-4 h-8 w-8 text-cyan" />
            <h2 className="font-display text-3xl font-bold">
              What is now ready to harden next?
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              The repository has a production-shaped backend skeleton. The next
              engineering increment should add authenticated user journeys,
              queue-backed video processing, provider adapters, and integration
              tests around the tRPC router contracts.
            </p>
          </div>

          <div className="grid gap-3">
            {backendCapabilities.map(capability => (
              <div
                key={capability}
                className="rounded-xl border border-border/40 bg-background/70 px-4 py-3 text-sm text-muted-foreground"
              >
                {capability}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
