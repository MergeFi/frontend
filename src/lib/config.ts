import { loadValidatedEnv } from "./env";

// Validated once per module load — see env.ts for what "validated" means
// for each variable and why (#26). next.config.ts already performs this
// same check at build time and aborts the build on failure, so by the time
// any code importing this module actually runs, these values are
// guaranteed valid; this call is what makes that guarantee hold for every
// consumer of this module rather than trusting next.config.ts alone.
const env = loadValidatedEnv();

export const API_BASE_URL = env.apiBaseUrl;

export const GITHUB_OAUTH_URL = `${API_BASE_URL}/auth/github`;

export const STELLAR_NETWORK = env.stellarNetwork;
