type RuntimeMode = "development" | "test" | "production";

type EnvironmentVariableDefinition = {
  name: string;
  requiredInProduction: boolean;
  description: string;
};

export type EnvironmentCheck = EnvironmentVariableDefinition & {
  configured: boolean;
};

const rawNodeEnv = process.env.NODE_ENV;
const runtimeMode: RuntimeMode =
  rawNodeEnv === "production"
    ? "production"
    : rawNodeEnv === "test"
      ? "test"
      : "development";

const getEnv = (name: string): string => process.env[name]?.trim() ?? "";

export const ENV = {
  appId: getEnv("VITE_APP_ID"),
  appTitle: getEnv("VITE_APP_TITLE") || "Ellie AI",
  cookieSecret: getEnv("JWT_SECRET"),
  databaseUrl: getEnv("DATABASE_URL"),
  oAuthServerUrl: getEnv("OAUTH_SERVER_URL"),
  ownerOpenId: getEnv("OWNER_OPEN_ID"),
  forgeApiUrl: getEnv("BUILT_IN_FORGE_API_URL"),
  forgeApiKey: getEnv("BUILT_IN_FORGE_API_KEY"),
  port: Number.parseInt(getEnv("PORT") || "3000", 10),
  runtimeMode,
  isProduction: runtimeMode === "production",
  isTest: runtimeMode === "test",
};

export const ENVIRONMENT_VARIABLES: EnvironmentVariableDefinition[] = [
  {
    name: "DATABASE_URL",
    requiredInProduction: true,
    description:
      "MySQL-compatible database connection string used by Drizzle ORM for video metadata and analysis results.",
  },
  {
    name: "JWT_SECRET",
    requiredInProduction: true,
    description:
      "High-entropy secret used to sign session cookies for authenticated owner/admin flows.",
  },
  {
    name: "BUILT_IN_FORGE_API_URL",
    requiredInProduction: true,
    description:
      "Forge-compatible API base URL for LLM, transcription, and storage proxy calls.",
  },
  {
    name: "BUILT_IN_FORGE_API_KEY",
    requiredInProduction: true,
    description:
      "Bearer token for Forge-compatible AI and storage proxy calls.",
  },
  {
    name: "VITE_APP_ID",
    requiredInProduction: false,
    description:
      "Public application identifier used by platform integrations and client-side metadata.",
  },
  {
    name: "VITE_APP_TITLE",
    requiredInProduction: false,
    description:
      "Human-readable application title surfaced in documentation and UI metadata.",
  },
  {
    name: "OAUTH_SERVER_URL",
    requiredInProduction: false,
    description:
      "OAuth server base URL for optional owner/admin authentication.",
  },
  {
    name: "OWNER_OPEN_ID",
    requiredInProduction: false,
    description:
      "OpenID subject that should receive the admin role after sign-in.",
  },
  {
    name: "PORT",
    requiredInProduction: false,
    description: "HTTP port. Defaults to 3000 when unset.",
  },
];

export function getEnvironmentChecks(): EnvironmentCheck[] {
  return ENVIRONMENT_VARIABLES.map(definition => ({
    ...definition,
    configured: Boolean(getEnv(definition.name)),
  }));
}

export function getMissingProductionVariables(): string[] {
  return getEnvironmentChecks()
    .filter(check => check.requiredInProduction && !check.configured)
    .map(check => check.name);
}

export function getEnvironmentStatus() {
  const checks = getEnvironmentChecks();
  const missingRequired = getMissingProductionVariables();

  return {
    service: "ellie-ai",
    runtimeMode: ENV.runtimeMode,
    productionReady: missingRequired.length === 0,
    missingRequired,
    configured: checks
      .filter(check => check.configured)
      .map(check => check.name),
    optionalMissing: checks
      .filter(check => !check.requiredInProduction && !check.configured)
      .map(check => check.name),
  };
}

export function assertProductionEnvironment(): void {
  const missing = getMissingProductionVariables();

  if (ENV.isProduction && missing.length > 0) {
    throw new Error(
      `Ellie production environment is incomplete. Missing required variables: ${missing.join(", ")}`
    );
  }
}
