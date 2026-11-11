/**
 * Voyage AI embeddings (REST). Must stay 1024-dimensional: document_chunks.embedding is vector(1024).
 * voyage-3.5 is multilingual (handles Turkish) and accepts output_dimension; override with VOYAGE_MODEL.
 */

export const EMBED_DIM = 1024;
const MODEL = () => process.env.VOYAGE_MODEL?.trim() || "voyage-3.5";
const BATCH = 48;
const PARALLEL = 3;

export class EmbedError extends Error {
  constructor(
    public code: "no_key" | "upstream",
    message: string,
  ) {
    super(message);
  }
}

const apiKey = () => process.env.VOYAGE_API_KEY?.replace(/^﻿/, "").trim();
export const embeddingsConfigured = () => Boolean(apiKey());

async function embedBatch(inputs: string[], inputType: "document" | "query"): Promise<number[][]> {
  const key = apiKey();
  if (!key) throw new EmbedError("no_key", "VOYAGE_API_KEY is not set.");
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ input: inputs, model: MODEL(), input_type: inputType, output_dimension: EMBED_DIM, truncation: true }),
    signal: AbortSignal.timeout(60_000),
  }).catch((e) => {
    throw new EmbedError("upstream", `Could not reach Voyage AI: ${e instanceof Error ? e.message : e}`);
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("Voyage error", res.status, detail.slice(0, 400));
    throw new EmbedError("upstream", `Voyage AI returned ${res.status}.`);
  }
  const json = (await res.json()) as { data?: { index: number; embedding: number[] }[] };
  const data = [...(json.data ?? [])].sort((a, b) => a.index - b.index).map((d) => d.embedding);
  if (data.length !== inputs.length || data.some((v) => v.length !== EMBED_DIM)) {
    throw new EmbedError("upstream", `Voyage returned an unexpected embedding shape (expected ${EMBED_DIM} dims).`);
  }
  return data;
}

/** Embeds document chunks in batches, a few requests at a time. Result order matches `texts`. */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const batches: string[][] = [];
  for (let i = 0; i < texts.length; i += BATCH) batches.push(texts.slice(i, i + BATCH));
  const out: number[][][] = new Array(batches.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(PARALLEL, batches.length) }, async () => {
      while (next < batches.length) {
        const i = next++;
        out[i] = await embedBatch(batches[i], "document");
      }
    }),
  );
  return out.flat();
}

export async function embedQuery(text: string): Promise<number[]> {
  return (await embedBatch([text], "query"))[0];
}

/** pgvector text literal, accepted by PostgREST for vector columns and RPC arguments. */
export const toVector = (v: number[]) => `[${v.join(",")}]`;
