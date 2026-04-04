import "dotenv/config";
import { initLogger, logStart, logComplete, logError, logEvent } from "./lib/logger.js";
import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaperRecord {
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

interface RawPaper {
  title: string;
  abstract: string;
  authors: string[];
  publishedDate: string;
  url: string;
  source: "pubmed" | "europepmc";
  pubmedId?: string;
  doi?: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PUBMED_SEARCH_URL =
  "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
const PUBMED_SUMMARY_URL =
  "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";
const PUBMED_FETCH_URL =
  "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi";
const EUROPEPMC_SEARCH_URL =
  "https://www.ebi.ac.uk/europepmc/webservices/rest/search";

const PUBMED_QUERY =
  '"ankylosing spondylitis"[MeSH] OR "axial spondyloarthritis"[MeSH] OR "Morbus Bechterew"';
const EUROPEPMC_QUERY =
  '"ankylosing spondylitis" OR "axial spondyloarthritis"';

const MAX_NEW_PAPERS = 150;

// ---------------------------------------------------------------------------
// Firebase init
// ---------------------------------------------------------------------------

function initFirebase() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("FIREBASE_PROJECT_ID is required");

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    // When GOOGLE_APPLICATION_CREDENTIALS is set, Admin SDK picks it up
    // automatically — but we can also load it explicitly.
    initializeApp({ projectId });
  } else {
    // Fallback: running in an environment with default credentials (e.g. GCP)
    initializeApp({ projectId });
  }

  return getFirestore();
}

// ---------------------------------------------------------------------------
// PubMed helpers
// ---------------------------------------------------------------------------

async function searchPubMed(): Promise<string[]> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 360 * 24 * 60 * 60 * 1000);
  const minDate = formatPubMedDate(cutoff);
  const maxDate = formatPubMedDate(now);

  const params = new URLSearchParams({
    db: "pubmed",
    term: PUBMED_QUERY,
    retmax: "200",
    retmode: "json",
    datetype: "pdat",
    mindate: minDate,
    maxdate: maxDate,
    sort: "date",
  });

  const res = await fetch(`${PUBMED_SEARCH_URL}?${params}`);
  if (!res.ok) throw new Error(`PubMed search failed: ${res.status}`);

  const data = await res.json();
  const ids: string[] = data.esearchresult?.idlist ?? [];
  console.log(`[PubMed] Found ${ids.length} IDs`);
  return ids;
}

function formatPubMedDate(d: Date): string {
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

async function fetchPubMedDetails(ids: string[]): Promise<RawPaper[]> {
  if (ids.length === 0) return [];

  // Use efetch to get abstracts (esummary doesn't include them)
  const params = new URLSearchParams({
    db: "pubmed",
    id: ids.join(","),
    retmode: "xml",
    rettype: "abstract",
  });

  const res = await fetch(`${PUBMED_FETCH_URL}?${params}`);
  if (!res.ok) throw new Error(`PubMed fetch failed: ${res.status}`);

  const xml = await res.text();
  return parsePubMedXml(xml);
}

function parsePubMedXml(xml: string): RawPaper[] {
  const papers: RawPaper[] = [];
  const articleRegex = /<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g;
  let match: RegExpExecArray | null;

  while ((match = articleRegex.exec(xml)) !== null) {
    const article = match[1];

    const pmid = extractTag(article, "PMID");
    const title = extractTag(article, "ArticleTitle") ?? "Untitled";
    const abstract = extractAbstract(article);
    const authors = extractAuthors(article);
    const pubDate = extractPubDate(article);
    const doi = extractDoi(article);

    papers.push({
      title: cleanXmlText(title),
      abstract: cleanXmlText(abstract),
      authors,
      publishedDate: pubDate,
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      source: "pubmed",
      pubmedId: pmid ?? undefined,
      doi: doi ?? undefined,
    });
  }

  return papers;
}

function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, "s");
  const m = regex.exec(xml);
  return m ? m[1].trim() : null;
}

function extractAbstract(xml: string): string {
  const abstractBlock = /<Abstract>([\s\S]*?)<\/Abstract>/.exec(xml);
  if (!abstractBlock) return "";

  const texts: string[] = [];
  const textRegex = /<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g;
  let m: RegExpExecArray | null;
  while ((m = textRegex.exec(abstractBlock[1])) !== null) {
    texts.push(m[1].trim());
  }
  return texts.join(" ");
}

function extractAuthors(xml: string): string[] {
  const authors: string[] = [];
  const authorRegex = /<Author[^>]*>([\s\S]*?)<\/Author>/g;
  let m: RegExpExecArray | null;
  while ((m = authorRegex.exec(xml)) !== null) {
    const last = extractTag(m[1], "LastName");
    const initials = extractTag(m[1], "Initials");
    if (last) authors.push(initials ? `${last} ${initials}` : last);
  }
  return authors;
}

function extractPubDate(xml: string): string {
  const pubDate = /<PubDate>([\s\S]*?)<\/PubDate>/.exec(xml);
  if (!pubDate) return new Date().toISOString();

  const year = extractTag(pubDate[1], "Year") ?? new Date().getFullYear().toString();
  const month = extractTag(pubDate[1], "Month") ?? "01";
  const day = extractTag(pubDate[1], "Day") ?? "01";

  // Month can be a name like "Jan"
  const monthNum = parseMonth(month);
  return `${year}-${monthNum}-${day.padStart(2, "0")}`;
}

function parseMonth(m: string): string {
  const months: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };
  if (months[m]) return months[m];
  const num = parseInt(m, 10);
  if (!isNaN(num)) return String(num).padStart(2, "0");
  return "01";
}

function extractDoi(xml: string): string | null {
  const doiRegex = /<ArticleId IdType="doi">(.*?)<\/ArticleId>/;
  const m = doiRegex.exec(xml);
  return m ? m[1].trim() : null;
}

function cleanXmlText(text: string): string {
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

// ---------------------------------------------------------------------------
// Europe PMC helpers
// ---------------------------------------------------------------------------

async function searchEuropePmc(): Promise<RawPaper[]> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 360 * 24 * 60 * 60 * 1000);
  const fromDate = cutoff.toISOString().slice(0, 10);

  const params = new URLSearchParams({
    query: `${EUROPEPMC_QUERY}`,
    fromSearchDate: fromDate,
    format: "json",
    pageSize: "100",
    sort: "date desc",
    resultType: "core",
  });

  const res = await fetch(`${EUROPEPMC_SEARCH_URL}?${params}`);
  if (!res.ok) throw new Error(`Europe PMC search failed: ${res.status}`);

  const data = await res.json();
  const results: any[] = data.resultList?.result ?? [];
  console.log(`[EuropePMC] Found ${results.length} results`);

  return results.map((r: any) => ({
    title: r.title ?? "Untitled",
    abstract: r.abstractText ?? "",
    authors: (r.authorList?.author ?? []).map(
      (a: any) => `${a.lastName ?? ""} ${a.initials ?? ""}`.trim()
    ),
    publishedDate: r.firstPublicationDate ?? new Date().toISOString().slice(0, 10),
    url: r.doi
      ? `https://doi.org/${r.doi}`
      : `https://europepmc.org/article/${r.source}/${r.id}`,
    source: "europepmc" as const,
    pubmedId: r.pmid ?? undefined,
    doi: r.doi ?? undefined,
  }));
}

// ---------------------------------------------------------------------------
// Firestore dedup
// ---------------------------------------------------------------------------

async function getExistingIdentifiers(
  db: FirebaseFirestore.Firestore
): Promise<{ dois: Set<string>; pmids: Set<string> }> {
  const dois = new Set<string>();
  const pmids = new Set<string>();

  const snapshot = await db.collection("papers").select("doi", "pubmedId").get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.doi) dois.add(data.doi);
    if (data.pubmedId) pmids.add(data.pubmedId);
  }

  console.log(`[Firestore] ${snapshot.size} existing papers (${dois.size} DOIs, ${pmids.size} PMIDs)`);
  return { dois, pmids };
}

function isDuplicate(
  paper: RawPaper,
  existing: { dois: Set<string>; pmids: Set<string> }
): boolean {
  if (paper.doi && existing.dois.has(paper.doi)) return true;
  if (paper.pubmedId && existing.pmids.has(paper.pubmedId)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Claude summary
// ---------------------------------------------------------------------------

function createAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is required");
  return new Anthropic({ apiKey });
}

async function generateSummary(
  client: Anthropic,
  title: string,
  abstract: string
): Promise<string> {
  if (!abstract) {
    return "Zusammenfassung nicht verfügbar — kein Abstract vorhanden.";
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

// ---------------------------------------------------------------------------
// Keyword extraction (simple)
// ---------------------------------------------------------------------------

function extractTags(title: string, abstract: string): string[] {
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
    if (text.includes(key)) tags.push(label);
  }

  return tags.length > 0 ? tags : ["axSpA"];
}

// ---------------------------------------------------------------------------
// Store in Firestore
// ---------------------------------------------------------------------------

async function storePaper(
  db: FirebaseFirestore.Firestore,
  paper: RawPaper,
  summary: string
): Promise<string> {
  const now = Timestamp.now();
  let publishedAt: Timestamp;
  try {
    publishedAt = Timestamp.fromDate(new Date(paper.publishedDate));
  } catch {
    publishedAt = now;
  }

  const record: PaperRecord = {
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

  // Remove undefined fields
  const clean = Object.fromEntries(
    Object.entries(record).filter(([_, v]) => v !== undefined)
  );

  const ref = await db.collection("papers").add(clean);
  return ref.id;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== SpondylAtlas Paper Search Agent ===");
  console.log(`Run started at ${new Date().toISOString()}\n`);

  const db = initFirebase();

  initLogger("paper-search");
  await logStart("Suche neue axSpA-Studien in PubMed & Europe PMC");
  const anthropic = createAnthropicClient();

  // 1. Fetch from both sources in parallel
  const [pubmedIds, europeResults] = await Promise.all([
    searchPubMed().catch((err) => {
      console.error("[PubMed] Search error:", err.message);
      return [] as string[];
    }),
    searchEuropePmc().catch((err) => {
      console.error("[EuropePMC] Search error:", err.message);
      return [] as RawPaper[];
    }),
  ]);

  // 2. Fetch PubMed details
  const pubmedPapers = await fetchPubMedDetails(pubmedIds).catch((err) => {
    console.error("[PubMed] Fetch details error:", err.message);
    return [] as RawPaper[];
  });

  const allPapers = [...pubmedPapers, ...europeResults];
  await logEvent("step", `${allPapers.length} Papers gefunden`, `PubMed: ${pubmedPapers.length}, EuropePMC: ${europeResults.length}`);
  console.log(`\n[Total] ${allPapers.length} papers fetched (${pubmedPapers.length} PubMed, ${europeResults.length} EuropePMC)`);

  // 3. Deduplicate within the batch (prefer PubMed source)
  const seen = new Set<string>();
  const uniquePapers: RawPaper[] = [];
  for (const p of allPapers) {
    const key = p.doi ?? p.pubmedId ?? p.title;
    if (!seen.has(key)) {
      seen.add(key);
      uniquePapers.push(p);
    }
  }
  console.log(`[Dedup] ${uniquePapers.length} unique papers after cross-source dedup`);

  // 4. Relevance filter — title/abstract must clearly focus on AS/axSpA
  const AS_TERMS = ['ankylosing spondylitis', 'axial spondyloarthritis', 'spondylarthritis', 'morbus bechterew', 'nr-axspa', 'sacroiliitis', 'basdai', 'asdas', 'hla-b27'];
  const relevantPapers = uniquePapers.filter(p => {
    const text = `${p.title} ${p.abstract}`.toLowerCase();
    return AS_TERMS.some(term => text.includes(term));
  });
  console.log(`[Relevance] ${relevantPapers.length} of ${uniquePapers.length} papers passed AS relevance filter`);

  // 5. Deduplicate against Firestore
  const existing = await getExistingIdentifiers(db);
  const newPapers = relevantPapers.filter((p) => !isDuplicate(p, existing));
  console.log(`[Dedup] ${newPapers.length} new papers after Firestore dedup`);
  await logEvent("step", `${newPapers.length} neue Papers nach Duplikat-Prüfung`);

  // 6. Limit to MAX_NEW_PAPERS for cost control
  const toProcess = newPapers.slice(0, MAX_NEW_PAPERS);
  if (newPapers.length > MAX_NEW_PAPERS) {
    console.log(`[Limit] Processing ${MAX_NEW_PAPERS} of ${newPapers.length} new papers (cost control)`);
  }

  // 7. Generate summaries and store
  let added = 0;
  let errors = 0;

  for (const paper of toProcess) {
    try {
      console.log(`\n[Processing] ${paper.title.slice(0, 80)}...`);

      const summary = await generateSummary(anthropic, paper.title, paper.abstract);
      const docId = await storePaper(db, paper, summary);

      console.log(`  -> Stored as ${docId}`);
      await logEvent("step", `Paper gespeichert`, paper.title.slice(0, 120));
      added++;
    } catch (err: any) {
      console.error(`  -> Error: ${err.message}`);
      errors++;
    }
  }

  // 7. Summary
  console.log("\n=== Run Summary ===");
  console.log(`Papers found:   ${allPapers.length}`);
  console.log(`New added:      ${added}`);
  console.log(`Errors:         ${errors}`);
  await logComplete(
    `${added} neue Paper gespeichert, ${errors} Fehler, ${uniquePapers.length - newPapers.length} Duplikate`,
    added
  );
  console.log(`\nFinished at ${new Date().toISOString()}`);
}

main().catch(async (err) => {
  console.error("Fatal error:", err);
  try { await logError(err.message); } catch {}
  process.exit(1);
});
