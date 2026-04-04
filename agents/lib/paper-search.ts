import { Timestamp } from "firebase-admin/firestore";
import Anthropic from "@anthropic-ai/sdk";

export interface PaperRecord {
  title: string;
  abstract: string;
  summary: string;
  authors: string[];
  publishedAt: Timestamp;
  tags: string[];
  url: string;
  source: "pubmed" | "europepmc";
  pubmedId?: string;
  doi?: string;
  lang: "de";
  createdAt: Timestamp;
  status: "published";
}

export interface RawPaper {
  title: string;
  abstract: string;
  authors: string[];
  publishedDate: string;
  url: string;
  source: "pubmed" | "europepmc";
  pubmedId?: string;
  doi?: string;
}

export interface PaperSearchLogger {
  logStart(detail?: string): Promise<void>;
  logEvent(type: "start" | "step" | "complete" | "error" | "skip", message: string, detail?: string): Promise<void>;
  logComplete(summary: string, itemsProcessed?: number): Promise<void>;
}

type FirestoreLike = {
  collection: (name: string) => {
    select: (...fields: string[]) => { get: () => Promise<{ size: number; docs: Array<{ data(): Record<string, string | undefined> }> }> };
    add: (data: Record<string, unknown>) => Promise<{ id: string }>;
  };
};

const PUBMED_SEARCH_URL =
  "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
const PUBMED_FETCH_URL =
  "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi";
const EUROPEPMC_SEARCH_URL =
  "https://www.ebi.ac.uk/europepmc/webservices/rest/search";

const PUBMED_QUERY =
  '"ankylosing spondylitis"[MeSH] OR "axial spondyloarthritis"[MeSH] OR "Morbus Bechterew"';
const EUROPEPMC_QUERY =
  '"ankylosing spondylitis" OR "axial spondyloarthritis"';

export function formatPubMedDate(d: Date): string {
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

export function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, "s");
  const match = regex.exec(xml);
  return match ? match[1].trim() : null;
}

export function extractAbstract(xml: string): string {
  const abstractBlock = /<Abstract>([\s\S]*?)<\/Abstract>/.exec(xml);
  if (!abstractBlock) return "";

  const texts: string[] = [];
  const textRegex = /<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g;
  let match: RegExpExecArray | null;
  while ((match = textRegex.exec(abstractBlock[1])) !== null) {
    texts.push(match[1].trim());
  }
  return texts.join(" ");
}

export function extractAuthors(xml: string): string[] {
  const authors: string[] = [];
  const authorRegex = /<Author[^>]*>([\s\S]*?)<\/Author>/g;
  let match: RegExpExecArray | null;
  while ((match = authorRegex.exec(xml)) !== null) {
    const last = extractTag(match[1], "LastName");
    const initials = extractTag(match[1], "Initials");
    if (last) {
      authors.push(initials ? `${last} ${initials}` : last);
    }
  }
  return authors;
}

export function parseMonth(month: string): string {
  const months: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };
  if (months[month]) return months[month];
  const numeric = Number.parseInt(month, 10);
  if (!Number.isNaN(numeric)) return String(numeric).padStart(2, "0");
  return "01";
}

export function extractPubDate(xml: string): string {
  const pubDate = /<PubDate>([\s\S]*?)<\/PubDate>/.exec(xml);
  if (!pubDate) return new Date().toISOString();

  const year = extractTag(pubDate[1], "Year") ?? new Date().getFullYear().toString();
  const month = parseMonth(extractTag(pubDate[1], "Month") ?? "01");
  const day = (extractTag(pubDate[1], "Day") ?? "01").padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function extractDoi(xml: string): string | null {
  const doiRegex = /<ArticleId IdType="doi">(.*?)<\/ArticleId>/;
  const match = doiRegex.exec(xml);
  return match ? match[1].trim() : null;
}

export function cleanXmlText(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function parsePubMedXml(xml: string): RawPaper[] {
  const papers: RawPaper[] = [];
  const articleRegex = /<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g;
  let match: RegExpExecArray | null;

  while ((match = articleRegex.exec(xml)) !== null) {
    const article = match[1];
    const pubmedId = extractTag(article, "PMID");
    const title = extractTag(article, "ArticleTitle") ?? "Untitled";
    const abstract = extractAbstract(article);
    const authors = extractAuthors(article);
    const publishedDate = extractPubDate(article);
    const doi = extractDoi(article);

    papers.push({
      title: cleanXmlText(title),
      abstract: cleanXmlText(abstract),
      authors,
      publishedDate,
      url: `https://pubmed.ncbi.nlm.nih.gov/${pubmedId}/`,
      source: "pubmed",
      pubmedId: pubmedId ?? undefined,
      doi: doi ?? undefined,
    });
  }

  return papers;
}

export function extractTags(title: string, abstract: string): string[] {
  const text = `${title} ${abstract}`.toLowerCase();
  const keywords: Record<string, string> = {
    "ankylosing spondylitis": "Ankylosing Spondylitis",
    "axial spondyloarthritis": "axiale Spondyloarthritis",
    "axspa": "axSpA",
    "nr-axspa": "nr-axSpA",
    "r-axspa": "r-axSpA",
    "morbus bechterew": "Morbus Bechterew",
    "tnf": "TNF",
    "il-17": "IL-17",
    "jak inhibitor": "JAK-Inhibitor",
    "biologic": "Biologika",
    "nsaid": "NSAID",
    "mri": "MRT",
    "radiograph": "Röntgen",
    "sacroiliitis": "Sakroiliitis",
    "hla-b27": "HLA-B27",
    "basdai": "BASDAI",
    "asdas": "ASDAS",
    "quality of life": "Lebensqualität",
    "exercise": "Bewegung",
    "physiotherapy": "Physiotherapie",
    "fatigue": "Fatigue",
    "uveitis": "Uveitis",
    "psoriasis": "Psoriasis",
    "inflammatory bowel": "CED",
    "gut inflammation": "Darmentzündung",
    "microbiome": "Mikrobiom",
    "genetics": "Genetik",
    "biomarker": "Biomarker",
    "remission": "Remission",
    "flare": "Schub",
  };

  const tags: string[] = [];
  for (const [key, label] of Object.entries(keywords)) {
    if (text.includes(key)) {
      tags.push(label);
    }
  }

  return tags.length > 0 ? tags : ["axSpA"];
}

export function dedupeBatch(papers: RawPaper[]): RawPaper[] {
  const seen = new Set<string>();
  const unique: RawPaper[] = [];

  for (const paper of papers) {
    const key = paper.doi ?? paper.pubmedId ?? paper.title;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(paper);
    }
  }

  return unique;
}

export function isDuplicate(
  paper: RawPaper,
  existing: { dois: Set<string>; pmids: Set<string> }
): boolean {
  return Boolean(
    (paper.doi && existing.dois.has(paper.doi)) ||
      (paper.pubmedId && existing.pmids.has(paper.pubmedId))
  );
}

export function buildPaperRecord(
  paper: RawPaper,
  summary: string,
  now = Timestamp.now()
): PaperRecord {
  let publishedAt = now;
  try {
    publishedAt = Timestamp.fromDate(new Date(paper.publishedDate));
  } catch {
    publishedAt = now;
  }

  return {
    title: paper.title,
    abstract: paper.abstract,
    summary,
    authors: paper.authors,
    publishedAt,
    tags: extractTags(paper.title, paper.abstract),
    url: paper.url,
    source: paper.source,
    pubmedId: paper.pubmedId,
    doi: paper.doi,
    lang: "de",
    createdAt: now,
    status: "published",
  };
}

export function sanitizeRecord(record: PaperRecord) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined)
  );
}

export async function getExistingIdentifiers(
  db: FirestoreLike
): Promise<{ dois: Set<string>; pmids: Set<string> }> {
  const snapshot = await db.collection("papers").select("doi", "pubmedId").get();
  const dois = new Set<string>();
  const pmids = new Set<string>();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (typeof data.doi === "string") dois.add(data.doi);
    if (typeof data.pubmedId === "string") pmids.add(data.pubmedId);
  }

  return { dois, pmids };
}

export async function searchPubMed(fetchFn: typeof fetch): Promise<string[]> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    db: "pubmed",
    term: PUBMED_QUERY,
    retmax: "50",
    retmode: "json",
    datetype: "pdat",
    mindate: formatPubMedDate(thirtyDaysAgo),
    maxdate: formatPubMedDate(now),
    sort: "date",
  });

  const response = await fetchFn(`${PUBMED_SEARCH_URL}?${params}`);
  if (!response.ok) throw new Error(`PubMed search failed: ${response.status}`);

  const data = await response.json() as { esearchresult?: { idlist?: string[] } };
  return data.esearchresult?.idlist ?? [];
}

export async function fetchPubMedDetails(fetchFn: typeof fetch, ids: string[]): Promise<RawPaper[]> {
  if (ids.length === 0) return [];

  const params = new URLSearchParams({
    db: "pubmed",
    id: ids.join(","),
    retmode: "xml",
    rettype: "abstract",
  });

  const response = await fetchFn(`${PUBMED_FETCH_URL}?${params}`);
  if (!response.ok) throw new Error(`PubMed fetch failed: ${response.status}`);
  return parsePubMedXml(await response.text());
}

export async function searchEuropePmc(fetchFn: typeof fetch): Promise<RawPaper[]> {
  const params = new URLSearchParams({
    query: EUROPEPMC_QUERY,
    format: "json",
    pageSize: "25",
    sort: "date desc",
    resultType: "core",
  });

  const response = await fetchFn(`${EUROPEPMC_SEARCH_URL}?${params}`);
  if (!response.ok) throw new Error(`Europe PMC search failed: ${response.status}`);

  const data = await response.json() as {
    resultList?: {
      result?: Array<Record<string, unknown>>;
    };
  };

  return (data.resultList?.result ?? []).map((result) => {
    const authorList = Array.isArray((result.authorList as { author?: Array<{ lastName?: string; initials?: string }> } | undefined)?.author)
      ? (result.authorList as { author: Array<{ lastName?: string; initials?: string }> }).author
      : [];

    return {
      title: typeof result.title === "string" ? result.title : "Untitled",
      abstract: typeof result.abstractText === "string" ? result.abstractText : "",
      authors: authorList.map((author) => `${author.lastName ?? ""} ${author.initials ?? ""}`.trim()).filter(Boolean),
      publishedDate: typeof result.firstPublicationDate === "string" ? result.firstPublicationDate : new Date().toISOString().slice(0, 10),
      url: typeof result.doi === "string"
        ? `https://doi.org/${result.doi}`
        : `https://europepmc.org/article/${result.source ?? "MED"}/${result.id ?? ""}`,
      source: "europepmc" as const,
      pubmedId: typeof result.pmid === "string" ? result.pmid : undefined,
      doi: typeof result.doi === "string" ? result.doi : undefined,
    };
  });
}

export async function generateSummary(
  client: Anthropic,
  title: string,
  abstract: string
): Promise<string> {
  if (!abstract) {
    return "Zusammenfassung nicht verfügbar - kein Abstract vorhanden.";
  }

  const message = await client.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `Fasse diese wissenschaftliche Studie über Morbus Bechterew/axiale Spondyloarthritis in 3-4 Sätzen auf Deutsch zusammen. Erkläre die wichtigsten Erkenntnisse für medizinische Laien verständlich.

Titel: ${title}
Abstract: ${abstract}`,
      },
    ],
  });

  const block = message.content[0];
  if (block.type === "text") return block.text;
  return "Zusammenfassung konnte nicht generiert werden.";
}

export async function storePaper(
  db: FirestoreLike,
  paper: RawPaper,
  summary: string,
  now = Timestamp.now()
) {
  const record = sanitizeRecord(buildPaperRecord(paper, summary, now));
  return db.collection("papers").add(record);
}

export async function runPaperSearch({
  db,
  anthropic,
  logger,
  fetchFn = fetch,
  maxNewPapers = 50,
}: {
  db: FirestoreLike;
  anthropic: Anthropic;
  logger: PaperSearchLogger;
  fetchFn?: typeof fetch;
  maxNewPapers?: number;
}) {
  await logger.logStart("Suche neue axSpA-Studien in PubMed & Europe PMC");

  const [pubmedIds, europeResults] = await Promise.all([
    searchPubMed(fetchFn).catch(() => [] as string[]),
    searchEuropePmc(fetchFn).catch(() => [] as RawPaper[]),
  ]);

  const pubmedPapers = await fetchPubMedDetails(fetchFn, pubmedIds).catch(() => [] as RawPaper[]);
  const allPapers = [...pubmedPapers, ...europeResults];
  await logger.logEvent("step", `${allPapers.length} Papers gefunden`, `PubMed: ${pubmedPapers.length}, EuropePMC: ${europeResults.length}`);

  const uniquePapers = dedupeBatch(allPapers);
  const existing = await getExistingIdentifiers(db);
  const newPapers = uniquePapers.filter((paper) => !isDuplicate(paper, existing)).slice(0, maxNewPapers);
  await logger.logEvent("step", `${newPapers.length} neue Papers nach Duplikat-Prüfung`);

  let added = 0;
  let errors = 0;

  for (const paper of newPapers) {
    try {
      const summary = await generateSummary(anthropic, paper.title, paper.abstract);
      await storePaper(db, paper, summary);
      await logger.logEvent("step", "Paper gespeichert", paper.title.slice(0, 120));
      added++;
    } catch {
      errors++;
    }
  }

  await logger.logComplete(
    `${added} neue Paper gespeichert, ${errors} Fehler, ${uniquePapers.length - newPapers.length} Duplikate`,
    added
  );

  return { found: allPapers.length, unique: uniquePapers.length, added, errors };
}
