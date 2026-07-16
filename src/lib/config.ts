const VALID_STELLAR_NETWORKS = ["PUBLIC", "TESTNET"] as const;
type StellarNetwork = (typeof VALID_STELLAR_NETWORKS)[number];

function validateStellarNetwork(value: string | undefined): StellarNetwork {
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "NEXT_PUBLIC_STELLAR_NETWORK must be set in production. " +
          'Valid values: "PUBLIC", "TESTNET". ' +
          "Accidental TESTNET in production would sign transactions with the wrong network passphrase.",
      );
    }
    return "TESTNET";
  }

  const normalized = value.toUpperCase();
  if (!VALID_STELLAR_NETWORKS.includes(normalized as StellarNetwork)) {
    throw new Error(
      `Invalid NEXT_PUBLIC_STELLAR_NETWORK: "${value}". ` +
        `Valid values: ${VALID_STELLAR_NETWORKS.join(", ")}.`,
    );
  }

  return normalized as StellarNetwork;
}

function validateApiUrl(value: string | undefined): string {
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "NEXT_PUBLIC_API_URL must be set in production. " +
          "Falling back to localhost would break all API calls.",
      );
    }
    return "http://localhost:4000/api";
  }

  try {
    new URL(value);
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_API_URL: "${value}". Must be a valid URL.`,
    );
  }

  return value;
}

export const STELLAR_NETWORK = validateStellarNetwork(
  process.env.NEXT_PUBLIC_STELLAR_NETWORK,
);

export const API_BASE_URL = validateApiUrl(process.env.NEXT_PUBLIC_API_URL);

export const GITHUB_OAUTH_URL = `${API_BASE_URL}/auth/github`;
