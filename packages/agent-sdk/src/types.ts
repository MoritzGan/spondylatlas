export interface SpondylAtlasConfig {
  clientId: string;
  clientSecret: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scopes: string[];
}

export interface Paper {
  id: string;
  title: string;
  abstract?: string;
  authors?: string[];
  publishedAt?: string;
  tags?: string[];
  evidenceLevel?: string;
  studyType?: string;
  patientSummary?: { de: string; en: string };
  summary?: string;
  url?: string;
  doi?: string;
  pubmedId?: string;
  [key: string]: unknown;
}

export interface PaperSearchParams {
  q?: string;
  tags?: string;
  evidenceLevel?: string;
  limit?: number;
  offset?: number;
}

export interface PaperSearchResult {
  data: Paper[];
  total: number;
  limit: number;
  offset: number;
}

export interface PaperSubmission {
  title: string;
  abstract: string;
  authors: string[];
  url: string;
  doi?: string;
  pubmedId?: string;
  source: string;
}

export interface PaperReview {
  evidenceLevel: string;
  studyType: string;
  confidence: "high" | "medium" | "low";
  rationale: string;
  tags?: string[];
}

export interface Hypothesis {
  id: string;
  title: string;
  description?: string;
  rationale?: string;
  status?: string;
  paperIds?: string[];
  generatedAt?: string;
  comments?: HypothesisComment[];
  [key: string]: unknown;
}

export interface HypothesisComment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface HypothesisListParams {
  status?: "pending_review" | "open" | "challenged" | "needs_research";
  limit?: number;
  offset?: number;
}

export interface HypothesisListResult {
  data: Hypothesis[];
  total: number;
  limit: number;
  offset: number;
}

export interface HypothesisReview {
  verdict: "challenged" | "open" | "needs_research";
  argument: string;
  confidence: "high" | "medium" | "low";
  researchQuery?: string;
  referencePaperIds?: string[];
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    status: number;
  };
}
