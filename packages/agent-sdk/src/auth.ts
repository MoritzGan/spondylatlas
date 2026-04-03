import type { TokenResponse } from "./types.js";
import { AuthenticationError } from "./errors.js";

interface AuthConfig {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
  timeout: number;
}

export class TokenManager {
  private token: string | null = null;
  private expiresAt = 0;
  private refreshPromise: Promise<string> | null = null;

  constructor(private config: AuthConfig) {}

  async getToken(): Promise<string> {
    // Return cached token if still valid (with 5 min buffer)
    if (this.token && Date.now() < this.expiresAt - 300_000) {
      return this.token;
    }

    // Deduplicate concurrent refresh calls
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.fetchToken();
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  invalidate(): void {
    this.token = null;
    this.expiresAt = 0;
  }

  private async fetchToken(): Promise<string> {
    const res = await fetch(`${this.config.baseUrl}/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null) as { error?: { message?: string } } | null;
      const detail = body?.error?.message ?? `HTTP ${res.status}`;
      throw new AuthenticationError(`Token exchange failed: ${detail}`);
    }

    const data = (await res.json()) as TokenResponse;
    this.token = data.access_token;
    this.expiresAt = Date.now() + data.expires_in * 1000;
    return this.token;
  }
}
