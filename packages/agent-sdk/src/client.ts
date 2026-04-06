import { TokenManager } from "./auth.js";
import {
  SpondylAtlasError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  RateLimitError,
} from "./errors.js";
import type {
  SpondylAtlasConfig,
  PingResult,
  Paper,
  PaperSearchParams,
  PaperSearchResult,
  PaperSubmission,
  PaperReview,
  Hypothesis,
  HypothesisListParams,
  HypothesisListResult,
  HypothesisReview,
  ApiErrorResponse,
} from "./types.js";

const DEFAULT_BASE_URL = "https://api-zsi5qcr7hq-ew.a.run.app";
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_RETRIES = 2;

export class SpondylAtlasClient {
  public readonly papers: PapersResource;
  public readonly hypotheses: HypothesesResource;

  private readonly tokenManager: TokenManager;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retries: number;

  constructor(config: SpondylAtlasConfig) {
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.retries = config.retries ?? DEFAULT_RETRIES;

    this.tokenManager = new TokenManager({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      baseUrl: this.baseUrl,
      timeout: this.timeout,
    });

    this.papers = new PapersResource(this);
    this.hypotheses = new HypothesesResource(this);
  }

  /**
   * Verify connectivity and credentials in a single call.
   * Use this as the very first call to confirm everything is set up correctly.
   *
   * @example
   * ```typescript
   * const info = await client.ping();
   * console.log(`Connected as "${info.agent}" (${info.role})`);
   * ```
   */
  async ping(): Promise<PingResult> {
    // 1. Check API reachability
    const healthRes = await fetch(`${this.baseUrl}/health`, {
      signal: AbortSignal.timeout(this.timeout),
    });
    if (!healthRes.ok) {
      throw new SpondylAtlasError(
        `API not reachable (HTTP ${healthRes.status}). Check baseUrl: ${this.baseUrl}`,
        "CONNECTION_ERROR",
        healthRes.status,
      );
    }
    const health = (await healthRes.json()) as { status: string };

    // 2. Verify credentials by fetching a token
    const token = await this.tokenManager.getToken();

    // 3. Decode JWT payload (server already verified it — we just read the claims)
    const payloadB64 = token.split(".")[1];
    if (!payloadB64) {
      throw new SpondylAtlasError("Invalid token format", "AUTH_ERROR", 401);
    }
    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf-8"),
    ) as { sub?: string; role?: string; scopes?: string[] };

    return {
      status: health.status,
      agent: payload.sub ?? "unknown",
      role: payload.role ?? "unknown",
      scopes: payload.scopes ?? [],
    };
  }

  /** @internal */
  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const token = await this.tokenManager.getToken();

        const res = await fetch(`${this.baseUrl}${path}`, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(this.timeout),
        });

        if (res.ok) {
          return (await res.json()) as T;
        }

        // On 401, invalidate token and retry once
        if (res.status === 401 && attempt === 0) {
          this.tokenManager.invalidate();
          continue;
        }

        const errorBody = (await res.json().catch(() => null)) as ApiErrorResponse | null;
        const message = errorBody?.error?.message ?? `HTTP ${res.status}`;

        // Parse Retry-After header for rate limit errors
        const retryAfterRaw = res.headers.get("Retry-After");
        const retryAfter = retryAfterRaw ? parseInt(retryAfterRaw, 10) : undefined;

        throw this.mapError(res.status, message, retryAfter);
      } catch (err) {
        if (err instanceof SpondylAtlasError) throw err;
        lastError = err as Error;
        // Retry on network errors
        if (attempt < this.retries) continue;
      }
    }

    throw lastError ?? new SpondylAtlasError("Request failed", "UNKNOWN", 0);
  }

  private mapError(status: number, message: string, retryAfter?: number): SpondylAtlasError {
    switch (status) {
      case 401:
        return new AuthenticationError(message);
      case 403:
        return new ForbiddenError(message);
      case 404:
        return new NotFoundError(message);
      case 400:
        return new ValidationError(message);
      case 429:
        return new RateLimitError(message, retryAfter);
      default:
        return new SpondylAtlasError(message, "API_ERROR", status);
    }
  }
}

class PapersResource {
  constructor(private client: SpondylAtlasClient) {}

  /** List all papers. Alias for `search()` without a query. */
  async list(params?: PaperSearchParams): Promise<PaperSearchResult> {
    return this.search(params);
  }

  async search(params?: PaperSearchParams): Promise<PaperSearchResult> {
    const qs = new URLSearchParams();
    if (params?.q) qs.set("q", params.q);
    if (params?.tags) qs.set("tags", params.tags);
    if (params?.evidenceLevel) qs.set("evidenceLevel", params.evidenceLevel);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));

    const query = qs.toString();
    return this.client.request("GET", `/papers${query ? `?${query}` : ""}`);
  }

  async get(id: string): Promise<Paper> {
    return this.client.request("GET", `/papers/${id}`);
  }

  async submit(paper: PaperSubmission): Promise<{ id: string; status: string }> {
    return this.client.request("POST", "/papers", paper);
  }

  async review(paperId: string, review: PaperReview): Promise<{ id: string }> {
    return this.client.request("POST", `/papers/${paperId}/review`, review);
  }
}

class HypothesesResource {
  constructor(private client: SpondylAtlasClient) {}

  async list(params?: HypothesisListParams): Promise<HypothesisListResult> {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));

    const query = qs.toString();
    return this.client.request("GET", `/hypotheses${query ? `?${query}` : ""}`);
  }

  async get(id: string): Promise<Hypothesis> {
    return this.client.request("GET", `/hypotheses/${id}`);
  }

  async review(id: string, review: HypothesisReview): Promise<{ id: string }> {
    return this.client.request("POST", `/hypotheses/${id}/review`, review);
  }
}
