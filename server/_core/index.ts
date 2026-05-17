import "dotenv/config";
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { ENV, assertProductionEnvironment, getEnvironmentStatus } from "./env";
import { checkDatabaseReadiness, type DependencyReadiness } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

function applySecurityHeaders(req: Request, res: Response, next: NextFunction) {
  const connectSrc = ["'self'"];

  if (ENV.forgeApiUrl) {
    try {
      connectSrc.push(new URL(ENV.forgeApiUrl).origin);
    } catch {
      // Invalid URLs are reported by environment validation; do not block boot in development.
    }
  }

  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), geolocation=(), payment=(), usb=()"
  );
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      `connect-src ${connectSrc.join(" ")}`,
    ].join("; ")
  );

  next();
}

function getServiceDependencyStatus(): DependencyReadiness[] {
  const environment = getEnvironmentStatus();

  return [
    {
      name: "forge-api",
      configured:
        environment.configured.includes("BUILT_IN_FORGE_API_URL") &&
        environment.configured.includes("BUILT_IN_FORGE_API_KEY"),
      healthy:
        environment.configured.includes("BUILT_IN_FORGE_API_URL") &&
        environment.configured.includes("BUILT_IN_FORGE_API_KEY"),
      critical: true,
      message:
        environment.configured.includes("BUILT_IN_FORGE_API_URL") &&
        environment.configured.includes("BUILT_IN_FORGE_API_KEY")
          ? "Forge-compatible AI and storage proxy credentials are configured."
          : "Forge-compatible AI and storage proxy credentials are missing.",
    },
    {
      name: "session-secret",
      configured: environment.configured.includes("JWT_SECRET"),
      healthy: environment.configured.includes("JWT_SECRET"),
      critical: ENV.isProduction,
      message: environment.configured.includes("JWT_SECRET")
        ? "Session cookie secret is configured."
        : "JWT_SECRET is not configured; owner/admin sessions are not production-ready.",
    },
  ];
}

async function readinessReport() {
  const environment = getEnvironmentStatus();
  const dependencies = [
    await checkDatabaseReadiness(),
    ...getServiceDependencyStatus(),
  ];
  const ready =
    environment.productionReady &&
    dependencies.every(
      dependency => !dependency.critical || dependency.healthy
    );

  return {
    ok: ready,
    service: "ellie-ai",
    timestamp: new Date().toISOString(),
    runtimeMode: ENV.runtimeMode,
    environment,
    dependencies,
  };
}

async function startServer() {
  assertProductionEnvironment();

  const app = express();
  const server = createServer(app);

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(applySecurityHeaders);

  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      ok: true,
      service: "ellie-ai",
      timestamp: new Date().toISOString(),
      runtimeMode: ENV.runtimeMode,
    });
  });

  const readinessHandler = async (_req: Request, res: Response) => {
    const report = await readinessReport();
    res.status(report.ok ? 200 : 503).json(report);
  };

  app.get("/api/readiness", readinessHandler);
  app.get("/api/ready", readinessHandler);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = Number.isFinite(ENV.port) ? ENV.port : 3000;
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
