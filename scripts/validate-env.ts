import "dotenv/config";
import {
  ENV,
  getEnvironmentChecks,
  getEnvironmentStatus,
} from "../server/_core/env";

const checks = getEnvironmentChecks();
const status = getEnvironmentStatus();

console.log("Ellie environment inventory");
console.log(`mode=${ENV.runtimeMode}`);
console.log(`productionReady=${status.productionReady}`);
console.log("");

for (const check of checks) {
  const requirement = check.requiredInProduction
    ? "required-in-production"
    : "optional";
  const state = check.configured ? "configured" : "missing";
  console.log(`${check.name}: ${state} (${requirement})`);
}

if (ENV.isProduction && !status.productionReady) {
  console.error("");
  console.error(
    `Missing required production variables: ${status.missingRequired.join(", ")}`
  );
  process.exit(1);
}

console.log("");
console.log("Environment validation completed without exposing secret values.");
