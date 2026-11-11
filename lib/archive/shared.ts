/** Constants and types shared by the archive API routes and the client components (no server-only imports). */

export const ARCHIVE_EXT = [".pdf", ".docx", ".udf", ".txt", ".md"];
/** Files go straight to Storage (not through the 4.5 MB function body limit), so this can be generous. */
export const MAX_ARCHIVE_BYTES = 25 * 1024 * 1024;
/** Text kept per document after extraction (≈ 600 pages). */
export const MAX_ARCHIVE_CHARS = 600_000;
export const MAX_FILES_PER_BATCH = 10;

export type DocStatus = "pending" | "processing" | "ready" | "failed";

export interface ArchiveDoc {
  id: string;
  title: string;
  file_name: string;
  status: DocStatus;
  error: string | null;
  created_at: string;
  char_count: number | null;
}

export interface SearchFilters {
  legalArea?: string;
  court?: string;
  chamber?: string;
  yearFrom?: number;
  yearTo?: number;
  statute?: string;
}

export interface SearchHit {
  chunkId: string;
  documentId: string;
  ord: number;
  heading: string | null;
  content: string;
  title: string;
  label: string; // "Yargıtay 9. HD, E. 2023/1234 K. 2024/567"
  legalArea: string | null;
  court: string | null;
  chamber: string | null;
  esasNo: string | null;
  kararNo: string | null;
  decisionDate: string | null;
  score: number;
  vectorRank: number | null;
  textRank: number | null;
}

export interface Citation {
  /** 1-based index into `sources`. */
  source: number;
  quote: string;
}
export interface AnswerSegment {
  text: string;
  citations: Citation[];
}
export interface AskResult {
  segments: AnswerSegment[];
  sources: SearchHit[];
  /** Citations the model produced that did not match the source text and were dropped. */
  droppedCitations: number;
  /** True when no sentence of the answer carries a verified citation. */
  ungrounded: boolean;
  mode: "hybrid" | "text";
}
